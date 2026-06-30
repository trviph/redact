import type { Redactor } from './redactor';

export interface RedactionObserver {
  /** Begins watching a root for added content, redacting it as it appears. */
  start(root: Node): void;
  /** Stops watching. */
  stop(): void;
}

/** True if a batch contains anything that could add or reintroduce matchable text. */
function isRelevant(mutations: MutationRecord[]): boolean {
  return mutations.some((m) => m.type === 'characterData' || m.addedNodes.length > 0);
}

/**
 * Watches the DOM for content added during parse and afterwards (SPA renders),
 * and for in-place text changes from re-renders. On any such change it re-sweeps
 * the whole document, so content rewritten *deep inside* a matched element — not
 * just newly added matched subtrees — is re-redacted. Redaction edits text data
 * only and adds no nodes, and already-redacted nodes are skipped, so a sweep
 * triggered by our own writes redacts nothing new and does not loop.
 */
export function createRedactionObserver(redactor: Redactor): RedactionObserver {
  const observer = new MutationObserver((mutations) => {
    if (isRelevant(mutations)) redactor.redactRoot(document);
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
