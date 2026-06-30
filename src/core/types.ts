export type SelectorType = 'css' | 'xpath';

/** Kinds of media element a rule can replace with a placeholder. */
export type MediaKind = 'image' | 'video' | 'embed';

/**
 * Selects a redaction strategy by name and carries strategy-specific options.
 * Options are deliberately open so new strategies can add fields without
 * changing this type; each strategy validates and narrows what it reads.
 */
export interface RedactStyleConfig {
  strategy: string;
  options?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  selector: string;
  selectorType: SelectorType;
  description?: string;
  style: RedactStyleConfig;
  /** Media element kinds to replace with a placeholder; [] or undefined means none. */
  media?: MediaKind[];
}

export interface Preset {
  id: string;
  name: string;
  domains: string[];
  enabled: boolean;
  rules: Rule[];
}

/**
 * Transforms the text of a single text node into its redacted form. Strategies
 * are pure: the same input always yields the same output, with no DOM or I/O.
 */
export interface RedactStrategy {
  name: string;
  redactText(text: string, options?: Record<string, unknown>): string;
}
