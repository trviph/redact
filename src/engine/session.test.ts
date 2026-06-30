import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Rule } from '../core/types';
import { createRedactionSession, type RedactionSession } from './session';

function rule(selector: string, id = selector): Rule {
  return { id, selector, selectorType: 'css', style: { strategy: 'whole' } };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let session: RedactionSession;

beforeEach(() => {
  document.body.innerHTML = '';
  session = createRedactionSession();
});

// Always tear down so a session's observer never leaks into the next test.
afterEach(() => {
  session.clear();
});

describe('createRedactionSession', () => {
  it('redacts matching elements on apply', () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    session.apply([rule('.secret')]);
    expect(document.querySelector('.secret')?.textContent).toBe('████');
  });

  it('does nothing on apply with no rules', () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    session.apply([]);
    expect(document.querySelector('.secret')?.textContent).toBe('John');
  });

  it('restores the page on clear', () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    session.apply([rule('.secret')]);
    session.clear();
    expect(document.querySelector('.secret')?.textContent).toBe('John');
  });

  it('re-applying a different rule set restores the old and applies the new', () => {
    document.body.innerHTML = '<p class="a">aaa</p><p class="b">bbb</p>';
    session.apply([rule('.a')]);
    expect(document.querySelector('.a')?.textContent).toBe('███');

    session.apply([rule('.b')]);
    expect(document.querySelector('.a')?.textContent).toBe('aaa'); // restored
    expect(document.querySelector('.b')?.textContent).toBe('███'); // newly redacted
  });

  it('stops observing after clear so late content is not redacted', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    session.apply([rule('.secret')]);
    session.clear();

    const el = document.createElement('p');
    el.className = 'secret';
    el.textContent = 'late';
    document.getElementById('host')!.appendChild(el);

    await flush();
    expect(el.textContent).toBe('late');
  });

  it('redacts late content while a rule set is applied', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    session.apply([rule('.secret')]);

    const el = document.createElement('p');
    el.className = 'secret';
    el.textContent = 'late';
    document.getElementById('host')!.appendChild(el);

    await flush();
    expect(el.textContent).toBe('████');
  });
});
