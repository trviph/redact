import type { MediaKind } from '../core/types';

/** Tag names that make up each media kind. */
export const KIND_TAGS: Record<MediaKind, string[]> = {
  image: ['img', 'svg', 'picture'],
  video: ['video'],
  embed: ['iframe', 'embed', 'object'],
};

/** Marks our placeholder elements so the engine never treats one as redactable media. */
export const PLACEHOLDER_ATTR = 'data-redact-placeholder';

// The image glyph's inner shapes, shared between the span icon and the data-URI src.
const IMAGE_ICON_SHAPES =
  '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>';

// Centered glyphs drawn in currentColor, so the placeholder's text color tints them.
const ICONS: Record<MediaKind, string> = {
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IMAGE_ICON_SHAPES}</svg>`,
  video:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg>',
  embed:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
};

/** The media kind of an element, restricted to the enabled kinds, or null. */
export function mediaKindOf(el: Element, kinds: MediaKind[]): MediaKind | null {
  const tag = el.tagName.toLowerCase();
  for (const kind of kinds) {
    if (KIND_TAGS[kind].includes(tag)) return kind;
  }
  return null;
}

/** A matched element plus any enabled-kind media inside it (self first). */
export function collectMedia(
  element: Element,
  kinds: MediaKind[],
): { el: Element; kind: MediaKind }[] {
  if (kinds.length === 0) return [];
  const found: { el: Element; kind: MediaKind }[] = [];
  const selfKind = mediaKindOf(element, kinds);
  if (selfKind) found.push({ el: element, kind: selfKind });
  const selector = kinds.flatMap((kind) => KIND_TAGS[kind]).join(',');
  for (const descendant of element.querySelectorAll(selector)) {
    const kind = mediaKindOf(descendant, kinds);
    if (kind) found.push({ el: descendant, kind });
  }
  return found;
}

/**
 * A neutral box that stands in for a redacted media element. It pins the
 * original width so the page doesn't reflow, carries the original aspect ratio
 * so it keeps shape, and caps at the container width so it fits horizontally.
 */
export function buildPlaceholder(doc: Document, rect: DOMRect, kind: MediaKind): HTMLElement {
  const span = doc.createElement('span');
  span.setAttribute(PLACEHOLDER_ATTR, kind);
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', `Redacted ${kind}`);
  span.innerHTML = ICONS[kind];
  span.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'box-sizing:border-box',
    `width:${rect.width}px`,
    `aspect-ratio:${rect.width} / ${rect.height}`,
    'max-width:100%',
    'background:#e5e5e5',
    'border:1px solid #bbb',
    'color:#888',
  ].join(';');
  const icon = span.firstElementChild as HTMLElement | null;
  if (icon) icon.style.cssText = 'width:40%;height:40%;max-width:48px;max-height:48px';
  return span;
}

/**
 * An `data:` SVG the size of the rendered image, used as a replacement `src` so
 * the original `<img>` keeps its element (and all its styling) while showing a
 * neutral placeholder. Matching the rect's aspect ratio means an `object-fit`
 * on the image has nothing to crop.
 */
export function imagePlaceholderSrc(width: number, height: number): string {
  const size = Math.min(width, height) * 0.4;
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>` +
    `<rect width='${width}' height='${height}' fill='#e5e5e5' stroke='#bbb'/>` +
    `<svg x='${x}' y='${y}' width='${size}' height='${size}' viewBox='0 0 24 24' ` +
    `fill='none' stroke='#888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>` +
    `${IMAGE_ICON_SHAPES}</svg></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
