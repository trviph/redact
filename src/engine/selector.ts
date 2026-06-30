import type { SelectorType } from '../core/types';

function ownerDocument(root: ParentNode): Document {
  return root.nodeType === Node.DOCUMENT_NODE
    ? (root as unknown as Document)
    : ((root as Node).ownerDocument as Document);
}

function findCss(root: ParentNode, selector: string): Element[] {
  const matches: Element[] = [];
  if (root instanceof Element && root.matches(selector)) {
    matches.push(root);
  }
  matches.push(...root.querySelectorAll(selector));
  return matches;
}

function findXpath(root: ParentNode, expression: string): Element[] {
  const result = ownerDocument(root).evaluate(
    expression,
    root as Node,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
  const matches: Element[] = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    const node = result.snapshotItem(i);
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      matches.push(node as Element);
    }
  }
  return matches;
}

/**
 * Finds the elements matched by a selector within a root. The root is included
 * in the search when it is itself an element, so the function works both for a
 * full-document sweep and for an individual subtree added later.
 *
 * An invalid or unsupported selector yields an empty result rather than
 * throwing, so one bad rule can never abort a redaction pass.
 */
export function findMatches(root: ParentNode, selector: string, type: SelectorType): Element[] {
  try {
    return type === 'xpath' ? findXpath(root, selector) : findCss(root, selector);
  } catch {
    return [];
  }
}
