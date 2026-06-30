import { describe, it, expect, beforeEach } from 'vitest';
import {
  mediaKindOf,
  collectMedia,
  buildPlaceholder,
  imagePlaceholderSrc,
  PLACEHOLDER_ATTR,
} from './media';

function rect(width: number, height: number): DOMRect {
  return { width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON() {} } as DOMRect;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('mediaKindOf', () => {
  it('maps tags to their kind when that kind is enabled', () => {
    document.body.innerHTML = '<img><svg></svg><video></video><iframe></iframe>';
    const all = ['image', 'video', 'embed'] as const;
    expect(mediaKindOf(document.querySelector('img')!, [...all])).toBe('image');
    expect(mediaKindOf(document.querySelector('svg')!, [...all])).toBe('image');
    expect(mediaKindOf(document.querySelector('video')!, [...all])).toBe('video');
    expect(mediaKindOf(document.querySelector('iframe')!, [...all])).toBe('embed');
  });

  it('returns null when the kind is not enabled', () => {
    document.body.innerHTML = '<img>';
    expect(mediaKindOf(document.querySelector('img')!, ['video'])).toBeNull();
  });

  it('returns null for non-media elements', () => {
    document.body.innerHTML = '<div></div>';
    expect(mediaKindOf(document.querySelector('div')!, ['image', 'video', 'embed'])).toBeNull();
  });
});

describe('collectMedia', () => {
  it('includes the element itself when it is an enabled kind', () => {
    document.body.innerHTML = '<img>';
    const found = collectMedia(document.querySelector('img')!, ['image']);
    expect(found.map((f) => f.el.tagName.toLowerCase())).toEqual(['img']);
  });

  it('includes enabled-kind descendants of a container', () => {
    document.body.innerHTML = '<div class="card"><img><video></video><span>x</span></div>';
    const found = collectMedia(document.querySelector('.card')!, ['image', 'video']);
    expect(found.map((f) => f.el.tagName.toLowerCase()).sort()).toEqual(['img', 'video']);
  });

  it('filters out kinds that are not enabled', () => {
    document.body.innerHTML = '<div class="card"><img><video></video></div>';
    const found = collectMedia(document.querySelector('.card')!, ['image']);
    expect(found.map((f) => f.el.tagName.toLowerCase())).toEqual(['img']);
  });

  it('returns nothing when no kinds are enabled', () => {
    document.body.innerHTML = '<img>';
    expect(collectMedia(document.querySelector('img')!, [])).toEqual([]);
  });
});

describe('buildPlaceholder', () => {
  it('pins width, carries aspect ratio, and fits horizontally', () => {
    const ph = buildPlaceholder(document, rect(200, 100), 'image');
    expect(ph.style.width).toBe('200px');
    expect(ph.style.aspectRatio).toBe('200 / 100');
    expect(ph.style.maxWidth).toBe('100%');
  });

  it('marks itself with the kind and an icon', () => {
    const ph = buildPlaceholder(document, rect(50, 50), 'video');
    expect(ph.getAttribute(PLACEHOLDER_ATTR)).toBe('video');
    expect(ph.querySelector('svg')).not.toBeNull();
    expect(ph.getAttribute('role')).toBe('img');
  });
});

describe('imagePlaceholderSrc', () => {
  it('is an svg data URI sized to the given box', () => {
    const src = imagePlaceholderSrc(200, 100);
    expect(src.startsWith('data:image/svg+xml,')).toBe(true);
    const svg = decodeURIComponent(src.slice('data:image/svg+xml,'.length));
    expect(svg).toContain("width='200'");
    expect(svg).toContain("height='100'");
    expect(svg).toContain('#e5e5e5'); // neutral fill, matching the box placeholder
  });
});
