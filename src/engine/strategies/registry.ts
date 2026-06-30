import type { RedactStrategy, RedactStyleConfig } from '../../core/types';
import { toBlocks } from './blocks';
import { wholeStrategy } from './whole';

const strategies = new Map<string, RedactStrategy>();

/** Registers a strategy, making it resolvable by name. */
export function registerStrategy(strategy: RedactStrategy): void {
  strategies.set(strategy.name, strategy);
}

/** Returns the strategy registered under a name, or undefined if none. */
export function getStrategy(name: string): RedactStrategy | undefined {
  return strategies.get(name);
}

/** Returns all registered strategies. */
export function listStrategies(): RedactStrategy[] {
  return [...strategies.values()];
}

/**
 * Resolves the configured strategy and applies it. Falls back to whole-block
 * redaction for an unknown strategy so a misconfigured rule still redacts
 * rather than leaking the original text.
 */
export function redactText(config: RedactStyleConfig, text: string): string {
  const strategy = getStrategy(config.strategy);
  if (strategy) return strategy.redactText(text, config.options);
  return toBlocks(text);
}

registerStrategy(wholeStrategy);
