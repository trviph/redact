import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFoucController, OVERLAY_ID, HIDING_CLASS } from './fouc';

beforeEach(() => {
  document.documentElement.className = '';
  document.body.innerHTML = '';
  document.querySelectorAll(`#${OVERLAY_ID}`).forEach((el) => el.remove());
});

describe('createFoucController', () => {
  it('hides the page and shows the overlay on hide()', () => {
    const fouc = createFoucController();
    fouc.hide();
    expect(fouc.isHidden).toBe(true);
    expect(document.documentElement.classList.contains(HIDING_CLASS)).toBe(true);
    expect(document.getElementById(OVERLAY_ID)).not.toBeNull();
  });

  it('shows the given message in the overlay', () => {
    const fouc = createFoucController({ message: 'Working' });
    fouc.hide();
    expect(document.getElementById(OVERLAY_ID)?.textContent).toContain('Working');
  });

  it('does not create a second overlay when hide() is called twice', () => {
    const fouc = createFoucController();
    fouc.hide();
    fouc.hide();
    expect(document.querySelectorAll(`#${OVERLAY_ID}`)).toHaveLength(1);
  });

  it('reveals the page and removes the overlay on reveal()', () => {
    const fouc = createFoucController();
    fouc.hide();
    fouc.reveal();
    expect(fouc.isHidden).toBe(false);
    expect(document.documentElement.classList.contains(HIDING_CLASS)).toBe(false);
    expect(document.getElementById(OVERLAY_ID)).toBeNull();
  });

  it('calls onReveal exactly once even if reveal() is called repeatedly', () => {
    const onReveal = vi.fn();
    const fouc = createFoucController({ onReveal });
    fouc.hide();
    fouc.reveal();
    fouc.reveal();
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('reveal() before hide() is a harmless no-op', () => {
    const onReveal = vi.fn();
    const fouc = createFoucController({ onReveal });
    expect(() => fouc.reveal()).not.toThrow();
    expect(onReveal).not.toHaveBeenCalled();
  });

  describe('failsafe', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('auto-reveals after the failsafe timeout', () => {
      const fouc = createFoucController({ failsafeMs: 1000 });
      fouc.hide();
      vi.advanceTimersByTime(1000);
      expect(fouc.isHidden).toBe(false);
    });

    it('cancels the failsafe once revealed manually, so onReveal fires only once', () => {
      const onReveal = vi.fn();
      const fouc = createFoucController({ failsafeMs: 1000, onReveal });
      fouc.hide();
      fouc.reveal();
      vi.advanceTimersByTime(2000);
      expect(onReveal).toHaveBeenCalledTimes(1);
    });
  });
});
