import type { Rule, RedactStyleConfig } from '../core/types';
import { findMatches } from './selector';
import { redactText } from './strategies/registry';

export interface Redactor {
  /** Redacts every match of the configured rules found within a root. */
  redactRoot(root: ParentNode): void;
  /** Whether a node has already been redacted by this redactor. */
  wasRedacted(node: Node): boolean;
}

/**
 * Applies a set of rules by replacing the text of matched elements in place.
 * Redacted text nodes are remembered so repeated passes (e.g. from the observer
 * re-scanning a subtree) neither double-process nor risk an update loop.
 */
export function createRedactor(rules: Rule[]): Redactor {
  const redactedNodes = new WeakSet<Node>();

  function redactElement(element: Element, style: RedactStyleConfig): void {
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const textNode = node as Text;
      if (!redactedNodes.has(textNode) && textNode.data.trim() !== '') {
        textNode.data = redactText(style, textNode.data);
        redactedNodes.add(textNode);
      }
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
    wasRedacted: (node) => redactedNodes.has(node),
  };
}
