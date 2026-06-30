import type { Rule, RedactStyleConfig, MediaKind } from '../core/types';
import { findMatches } from './selector';
import { redactText } from './strategies/registry';
import { collectMedia, buildPlaceholder, imagePlaceholderSrc, PLACEHOLDER_ATTR } from './media';

export interface Redactor {
  /** Redacts every match of the configured rules found within a root; returns how many text nodes it redacted. */
  redactRoot(root: ParentNode): number;
  /**
   * Re-redacts only the regions around the given changed elements: for each CSS
   * rule, the target's matched ancestor-or-self and its matched descendants.
   * Returns how many text nodes it redacted. (CSS rules only — see hasXpathRules.)
   */
  redactScoped(targets: Iterable<Element>): number;
  /** True if any rule is XPath, which has no cheap ancestor test and needs a whole-document scan. */
  readonly hasXpathRules: boolean;
  /** Whether a node has already been redacted by this redactor. */
  wasRedacted(node: Node): boolean;
  /** Restores every redacted text node to its original text and forgets it. */
  restoreAll(): void;
}

/** What we know about a text node we have redacted. */
interface Managed {
  /** The page's text before redaction; restored on undo. */
  original: string;
  /** The block text we wrote; lets us recognize our own writes. */
  redacted: string;
  /** The style that produced it, so a re-render can be re-redacted the same way. */
  style: RedactStyleConfig;
}

/** The inline styles we overwrote when capping an element's box, for exact restore. */
interface CappedBox {
  maxWidth: string;
  maxHeight: string;
  overflow: string;
}

/**
 * Applies a set of rules by replacing the text of matched elements in place.
 * Redaction is self-healing: we remember the exact block text written for each
 * node, skip it while it still holds that value (so our own writes never loop),
 * and re-redact it when the page has changed it — which is what keeps dynamic,
 * re-rendering pages covered.
 */
export function createRedactor(rules: Rule[]): Redactor {
  const managed = new Map<Text, Managed>();
  const capped = new Map<HTMLElement, CappedBox>();
  // Placeholder element -> the original media element it stands in for, so the
  // original can be swapped back on restore. The original is detached while a
  // placeholder holds its spot, which is why it is never re-matched.
  const mediaManaged = new Map<Element, Element>();
  // <img> we redact in place by swapping its content, so it keeps its own
  // styling. We remember the original src/srcset to restore, plus the
  // placeholder we wrote so we can tell our own value from a page rewrite.
  const mediaContent = new Map<HTMLImageElement, { src: string | null; srcset: string | null; placeholder: string }>();
  const cssRules = rules.filter((rule) => rule.selectorType === 'css');
  const hasXpathRules = rules.some((rule) => rule.selectorType === 'xpath');

  // Pin the element to its current size before its text is replaced, so the
  // wider block glyphs can't enlarge it and shift the layout. Capped once, while
  // the element still shows its original text; skipped if it isn't laid out yet
  // (retried on a later pass) so we never measure a zero box.
  function capBox(element: Element): void {
    if (!(element instanceof HTMLElement) || capped.has(element)) return;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    capped.set(element, {
      maxWidth: element.style.maxWidth,
      maxHeight: element.style.maxHeight,
      overflow: element.style.overflow,
    });
    element.style.maxWidth = `${rect.width}px`;
    element.style.maxHeight = `${rect.height}px`;
    element.style.overflow = 'hidden';
  }

  function processTextNode(textNode: Text, style: RedactStyleConfig): number {
    if (textNode.data.trim() === '') return 0;
    const entry = managed.get(textNode);
    if (entry && entry.redacted === textNode.data) return 0; // still our value
    const original = textNode.data;
    const redacted = redactText(style, original);
    textNode.data = redacted;
    managed.set(textNode, { original, redacted, style });
    return 1;
  }

  // Redacts an <img> in place: keeps the element (and its styling) and swaps its
  // content for a placeholder data-URI. Self-healing — re-applies if the page
  // later rewrites the src back to a real image.
  function redactImage(img: HTMLImageElement): number {
    const record = mediaContent.get(img);
    if (record && img.getAttribute('src') === record.placeholder) return 0; // still ours
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return 0; // not laid out yet; retried later
    const placeholder = imagePlaceholderSrc(rect.width, rect.height);
    const original = record ?? {
      src: img.getAttribute('src'),
      srcset: img.getAttribute('srcset'),
      placeholder,
    };
    original.placeholder = placeholder;
    img.removeAttribute('srcset');
    img.setAttribute('src', placeholder);
    mediaContent.set(img, original);
    return 1;
  }

  // Redacts each enabled-kind media element (the matched element or media inside
  // it). An <img> keeps its element with swapped content; other kinds are
  // replaced by a placeholder box. Reports the work done and whether the matched
  // element itself was handled — in which case it has no text left to redact.
  function redactMedia(element: Element, kinds: MediaKind[]): { count: number; elementHandled: boolean } {
    let count = 0;
    let elementHandled = false;
    for (const { el, kind } of collectMedia(element, kinds)) {
      // Skip detached nodes and anything that is (or sits inside) a placeholder,
      // so our own placeholder icons are never themselves redacted.
      if (!el.isConnected || el.closest(`[${PLACEHOLDER_ATTR}]`)) continue;
      let handled = false;
      if (el instanceof HTMLImageElement) {
        const wrote = redactImage(el);
        count += wrote;
        handled = wrote > 0 || mediaContent.has(el);
      } else {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue; // not laid out yet; retried later
        const placeholder = buildPlaceholder(el.ownerDocument, rect, kind);
        el.replaceWith(placeholder);
        mediaManaged.set(placeholder, el);
        count += 1;
        handled = true;
      }
      if (handled && el === element) elementHandled = true;
    }
    return { count, elementHandled };
  }

  function redactElement(element: Element, rule: Rule): number {
    let count = 0;
    if (rule.media && rule.media.length > 0) {
      const media = redactMedia(element, rule.media);
      count += media.count;
      if (media.elementHandled) return count;
    }
    capBox(element);
    const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      count += processTextNode(node as Text, rule.style);
      node = walker.nextNode();
    }
    return count;
  }

  function redactRoot(root: ParentNode): number {
    let count = 0;
    for (const rule of rules) {
      for (const element of findMatches(root, rule.selector, rule.selectorType)) {
        count += redactElement(element, rule);
      }
    }
    return count;
  }

  function redactScoped(targets: Iterable<Element>): number {
    let count = 0;
    const done = new Set<Element>();
    const redactOnce = (element: Element, rule: Rule) => {
      if (done.has(element)) return;
      done.add(element);
      count += redactElement(element, rule);
    };
    for (const target of targets) {
      for (const rule of cssRules) {
        const ancestor = target.closest(rule.selector);
        if (ancestor) redactOnce(ancestor, rule);
        for (const descendant of target.querySelectorAll(rule.selector)) {
          redactOnce(descendant, rule);
        }
      }
    }
    return count;
  }

  return {
    redactRoot,
    redactScoped,
    hasXpathRules,
    wasRedacted: (node) => node instanceof Text && managed.has(node),
    restoreAll() {
      for (const [textNode, entry] of managed) {
        textNode.data = entry.original;
      }
      managed.clear();
      for (const [element, box] of capped) {
        element.style.maxWidth = box.maxWidth;
        element.style.maxHeight = box.maxHeight;
        element.style.overflow = box.overflow;
      }
      capped.clear();
      for (const [placeholder, original] of mediaManaged) {
        if (placeholder.isConnected) placeholder.replaceWith(original);
      }
      mediaManaged.clear();
      for (const [img, record] of mediaContent) {
        if (record.src === null) img.removeAttribute('src');
        else img.setAttribute('src', record.src);
        if (record.srcset === null) img.removeAttribute('srcset');
        else img.setAttribute('srcset', record.srcset);
      }
      mediaContent.clear();
    },
  };
}
