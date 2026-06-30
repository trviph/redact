import type { Redactor } from './redactor';

export interface RedactionObserver {
  /** Begins watching a root for added content, redacting it as it appears. */
  start(root: Node): void;
  /** Stops watching. */
  stop(): void;
}

/** The element scope to re-check for a changed node: itself if an element, else its parent. */
function affectedElement(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

/** Collects the elements touched by a batch (added nodes and changed text), deduped. */
function affectedElements(mutations: MutationRecord[]): Set<Element> {
  const elements = new Set<Element>();
  for (const mutation of mutations) {
    if (mutation.type === 'characterData') {
      const el = affectedElement(mutation.target);
      if (el) elements.add(el);
      continue;
    }
    for (const added of mutation.addedNodes) {
      const el = affectedElement(added);
      if (el) elements.add(el);
    }
  }
  return elements;
}

/**
 * Watches the DOM for content added during parse and afterwards (SPA renders),
 * and for in-place text changes from re-renders. For CSS rules it re-redacts
 * only the elements a change touched — their matched ancestors and descendants —
 * so the cost is bounded by the changed region. XPath rules have no cheap
 * ancestor test, so they fall back to a whole-document sweep. Redaction edits
 * text data only and adds no nodes, and already-redacted nodes are skipped, so a
 * sweep triggered by our own writes redacts nothing new and does not loop.
 */
export function createRedactionObserver(redactor: Redactor): RedactionObserver {
  const observer = new MutationObserver((mutations) => {
    const targets = affectedElements(mutations);
    if (targets.size === 0) return;
    if (redactor.hasXpathRules) {
      redactor.redactRoot(document);
    } else {
      redactor.redactScoped(targets);
    }
  });

  return {
    start(root: Node): void {
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    },
    stop(): void {
      observer.disconnect();
    },
  };
}
