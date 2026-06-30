import type { Redactor } from './redactor';

export interface RedactionObserver {
  /** Begins watching a root for added content, redacting it as it appears. */
  start(root: Node): void;
  /** Stops watching. */
  stop(): void;
}

/** Resolves the nearest element to scan for an added node. */
function scanRoot(node: Node): ParentNode | null {
  if (node.nodeType === Node.ELEMENT_NODE) return node as Element;
  return node.parentElement;
}

/**
 * Watches the DOM for nodes added during incremental parse and afterwards (SPA
 * content), and for in-place text changes from re-renders. New subtrees are
 * redacted; text rewritten on a node we manage is re-redacted via refresh().
 * Our own writes are recognized and skipped, so we do not retrigger ourselves.
 */
export function createRedactionObserver(redactor: Redactor): RedactionObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        redactor.refresh(mutation.target);
        continue;
      }
      for (const added of mutation.addedNodes) {
        const root = scanRoot(added);
        if (root) redactor.redactRoot(root);
      }
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
