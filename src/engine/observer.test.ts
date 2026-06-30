import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Rule } from '../core/types';
import { createRedactor } from './redactor';
import { createRedactionObserver } from './observer';

const RULE: Rule = {
  id: 'r',
  selector: '.secret',
  selectorType: 'css',
  style: { strategy: 'whole' },
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let observer: ReturnType<typeof createRedactionObserver>;

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  observer?.stop();
});

describe('createRedactionObserver', () => {
  it('redacts a matching element added after start()', async () => {
    observer = createRedactionObserver(createRedactor([RULE]));
    observer.start(document.body);

    const el = document.createElement('p');
    el.className = 'secret';
    el.textContent = 'leak me';
    document.body.appendChild(el);

    await flush();
    expect(el.textContent).toBe('████ ██');
  });

  it('redacts a matching element nested inside an added subtree', async () => {
    observer = createRedactionObserver(createRedactor([RULE]));
    observer.start(document.body);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<span class="secret">nested</span>';
    document.body.appendChild(wrapper);

    await flush();
    expect(wrapper.querySelector('.secret')?.textContent).toBe('██████');
  });

  it('re-redacts text rewritten in place after redaction (characterData)', async () => {
    document.body.innerHTML = '<p class="secret">John</p>';
    const redactor = createRedactor([RULE]);
    observer = createRedactionObserver(redactor);
    observer.start(document.body);
    redactor.redactRoot(document);

    const textNode = document.querySelector('.secret')!.firstChild as Text;
    expect(textNode.data).toBe('████');

    // A framework re-render writes the real value back into the same node.
    textNode.data = 'Jane Roe';
    await flush();
    expect(textNode.data).toBe('████ ███');
  });

  it('stops redacting after stop()', async () => {
    observer = createRedactionObserver(createRedactor([RULE]));
    observer.start(document.body);
    observer.stop();

    const el = document.createElement('p');
    el.className = 'secret';
    el.textContent = 'still here';
    document.body.appendChild(el);

    await flush();
    expect(el.textContent).toBe('still here');
  });
});
