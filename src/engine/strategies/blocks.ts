export const DEFAULT_BLOCK_CHAR = '█';

/**
 * Replaces every visible character with a block character while preserving
 * whitespace, so the result keeps the original word lengths and layout — the
 * VSCode-minimap look.
 */
export function toBlocks(text: string, blockChar: string = DEFAULT_BLOCK_CHAR): string {
  return text.replace(/\S/gu, blockChar);
}
