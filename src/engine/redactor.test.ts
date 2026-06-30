import { describe, it, expect, beforeEach } from 'vitest';
import type { Rule } from '../core/types';
import { createRedactor } from './redactor';

function rule(overrides: Partial<Rule>): Rule {
  return {
    id: 'r',
    selector: '.secret',
    selectorType: 'css',
    style: { strategy: 'whole' },
    ...overrides,
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createRedactor', () => {
  it('replaces the text of matched elements with blocks', () => {
    document.body.innerHTML = '<p class="secret">John Doe</p>';
    createRedactor([rule({})]).redactRoot(document);
    expect(document.querySelector('.secret')?.textContent).toBe('████ ███');
  });

  it('leaves non-matching elements untouched', () => {
    document.body.innerHTML = '<p class="secret">hide</p><p class="keep">keep</p>';
    createRedactor([rule({})]).redactRoot(document);
    expect(document.querySelector('.keep')?.textContent).toBe('keep');
  });

  it('redacts text nested inside a matched element', () => {
    document.body.innerHTML = '<div class="secret">hi <b>there</b></div>';
    createRedactor([rule({})]).redactRoot(document);
    expect(document.querySelector('.secret')?.textContent).toBe('██ █████');
  });

  it('preserves whitespace-only text nodes so layout is unchanged', () => {
    document.body.innerHTML = '<div class="secret">  <span>x</span>  </div>';
    createRedactor([rule({})]).redactRoot(document);
    expect(document.querySelector('.secret')?.textContent).toBe('  █  ');
  });

  it('is idempotent: a second pass does not change already-redacted text', () => {
    document.body.innerHTML = '<p class="secret">secret</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    const once = document.querySelector('.secret')?.textContent;
    redactor.redactRoot(document);
    expect(document.querySelector('.secret')?.textContent).toBe(once);
    expect(once).toBe('██████');
  });

  it('supports xpath rules', () => {
    document.body.innerHTML = '<span>a</span><mark>b</mark>';
    createRedactor([rule({ selector: '//mark', selectorType: 'xpath' })]).redactRoot(document);
    expect(document.querySelector('mark')?.textContent).toBe('█');
    expect(document.querySelector('span')?.textContent).toBe('a');
  });

  it('reports whether a node was redacted', () => {
    document.body.innerHTML = '<p class="secret">x</p><p class="keep">y</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    const secretText = document.querySelector('.secret')!.firstChild!;
    const keepText = document.querySelector('.keep')!.firstChild!;
    expect(redactor.wasRedacted(secretText)).toBe(true);
    expect(redactor.wasRedacted(keepText)).toBe(false);
  });
});
