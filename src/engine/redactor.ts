import type { Rule, RedactStyleConfig } from '../core/types';
import { findMatches } from './selector';
import { redactText } from './strategies/registry';

export interface Redactor {
  /** Redacts every match of the configured rules found within a root; returns how many text nodes it redacted. */
  redactRoot(root: ParentNode): number;
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

/**
 * Applies a set of rules by replacing the text of matched elements in place.
 * Redaction is self-healing: we remember the exact block text written for each
 * node, skip it while it still holds that value (so our own writes never loop),
 * and re-redact it when the page has changed it — which is what keeps dynamic,
 * re-rendering pages covered.
 */
export function createRedactor(rules: Rule[]): Redactor {
  const managed = new Map<Text, Managed>();

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

  function redactElement(element: Element, style: RedactStyleConfig): number {
    const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let count = 0;
    let node = walker.nextNode();
    while (node) {
      count += processTextNode(node as Text, style);
      node = walker.nextNode();
    }
    return count;
  }

  function redactRoot(root: ParentNode): number {
    let count = 0;
    for (const rule of rules) {
      for (const element of findMatches(root, rule.selector, rule.selectorType)) {
        count += redactElement(element, rule.style);
      }
    }
    return count;
  }

  return {
    redactRoot,
    wasRedacted: (node) => node instanceof Text && managed.has(node),
    restoreAll() {
      for (const [textNode, entry] of managed) {
        textNode.data = entry.original;
      }
      managed.clear();
    },
  };
}
