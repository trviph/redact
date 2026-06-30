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

  it('restores the original text on restoreAll', () => {
    document.body.innerHTML = '<p class="secret">John Doe</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    expect(document.querySelector('.secret')?.textContent).toBe('████ ███');
    redactor.restoreAll();
    expect(document.querySelector('.secret')?.textContent).toBe('John Doe');
  });

  it('restores nested original text too', () => {
    document.body.innerHTML = '<div class="secret">hi <b>there</b></div>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    redactor.restoreAll();
    expect(document.querySelector('.secret')?.textContent).toBe('hi there');
  });

  it('re-redacts a node whose text the page rewrote in place', () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    const textNode = document.querySelector('.secret')!.firstChild as Text;

    // Simulate a framework re-render writing a fresh real value back.
    textNode.data = 'Jane Roe';
    redactor.redactRoot(document);
    expect(textNode.data).toBe('████ ███');
  });

  it('leaves an already-redacted node unchanged on a repeat pass (no loop)', () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    const textNode = document.querySelector('.secret')!.firstChild as Text;
    redactor.refresh(textNode); // our own value — must not re-process
    expect(textNode.data).toBe('████');
  });

  it('refreshes a managed node after the page rewrites it', () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    const textNode = document.querySelector('.secret')!.firstChild as Text;
    textNode.data = 'Jane Roe';
    redactor.refresh(textNode);
    expect(textNode.data).toBe('████ ███');
  });

  it('forgets nodes after restore so a later pass redacts again', () => {
    document.body.innerHTML = '<p class="secret">secret</p>';
    const redactor = createRedactor([rule({})]);
    redactor.redactRoot(document);
    redactor.restoreAll();
    const text = document.querySelector('.secret')!.firstChild!;
    expect(redactor.wasRedacted(text)).toBe(false);
    redactor.redactRoot(document);
    expect(document.querySelector('.secret')?.textContent).toBe('██████');
  });
});
