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
 * content), redacting each newly added subtree. Redaction edits text data only
 * and never inserts nodes, so it does not retrigger the observer.
 */
export function createRedactionObserver(redactor: Redactor): RedactionObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const added of mutation.addedNodes) {
        const root = scanRoot(added);
        if (root) redactor.redactRoot(root);
      }
    }
  });

  return {
    start(root: Node): void {
      observer.observe(root, { childList: true, subtree: true });
    },
    stop(): void {
      observer.disconnect();
    },
  };
}
