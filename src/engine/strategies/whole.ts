import type { RedactStrategy } from '../../core/types';
import { toBlocks } from './blocks';

/** Redacts the entire text into block characters. */
export const wholeStrategy: RedactStrategy = {
  name: 'whole',
  redactText(text: string, options?: Record<string, unknown>): string {
    const blockChar = typeof options?.blockChar === 'string' ? options.blockChar : undefined;
    return toBlocks(text, blockChar);
  },
};
