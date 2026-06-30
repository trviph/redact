import type { Rule } from '../core/types';
import { createRedactor, type Redactor } from './redactor';
import { createRedactionObserver, type RedactionObserver } from './observer';

export interface RedactionSession {
  /** Restores any current redaction, then redacts the given rules (no-op if empty). */
  apply(rules: Rule[]): void;
  /** Restores the page to its original state and stops observing. */
  clear(): void;
}

/**
 * Holds the live redaction state for a page and lets it be reconciled in place:
 * applying a new rule set first undoes the previous one, so toggling a preset
 * on or off updates an open page without a reload.
 */
export function createRedactionSession(): RedactionSession {
  let redactor: Redactor | null = null;
  let observer: RedactionObserver | null = null;

  function clear(): void {
    observer?.stop();
    redactor?.restoreAll();
    observer = null;
    redactor = null;
  }

  function apply(rules: Rule[]): void {
    clear();
    if (rules.length === 0) return;
    redactor = createRedactor(rules);
    observer = createRedactionObserver(redactor);
    observer.start(document.documentElement);
    redactor.redactRoot(document);
  }

  return { apply, clear };
}
