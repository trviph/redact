import type { Rule, RedactStyleConfig } from '../core/types';
import { findMatches } from './selector';
import { redactText } from './strategies/registry';

export interface Redactor {
  /** Redacts every match of the configured rules found within a root. */
  redactRoot(root: ParentNode): void;
  /** Whether a node has already been redacted by this redactor. */
  wasRedacted(node: Node): boolean;
  /**
   * Re-redacts a managed text node if the page has rewritten its text (e.g. a
   * framework re-render). A no-op for unmanaged nodes and for our own writes.
   */
  refresh(node: Node): void;
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

/**
 * Applies a set of rules by replacing the text of matched elements in place.
 * Redaction is self-healing: we remember the exact block text written for each
 * node, skip it while it still holds that value (so our own writes never loop),
 * and re-redact it when the page has changed it — which is what keeps dynamic,
 * re-rendering pages covered.
 */
export function createRedactor(rules: Rule[]): Redactor {
  const managed = new Map<Text, Managed>();

  function processTextNode(textNode: Text, style: RedactStyleConfig): void {
    if (textNode.data.trim() === '') return;
    const entry = managed.get(textNode);
    if (entry && entry.redacted === textNode.data) return; // still our value
    const original = textNode.data;
    const redacted = redactText(style, original);
    textNode.data = redacted;
    managed.set(textNode, { original, redacted, style });
  }

  function redactElement(element: Element, style: RedactStyleConfig): void {
    const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      processTextNode(node as Text, style);
      node = walker.nextNode();
    }
  }

  function redactRoot(root: ParentNode): void {
    for (const rule of rules) {
      for (const element of findMatches(root, rule.selector, rule.selectorType)) {
        redactElement(element, rule.style);
      }
    }
  }

  return {
    redactRoot,
    wasRedacted: (node) => node instanceof Text && managed.has(node),
    refresh(node) {
      if (!(node instanceof Text)) return;
      const entry = managed.get(node);
      if (!entry) return;
      processTextNode(node, entry.style);
    },
    restoreAll() {
      for (const [textNode, entry] of managed) {
        textNode.data = entry.original;
      }
      managed.clear();
    },
  };
}
