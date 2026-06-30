export type EditorTarget = { mode: 'list' } | { mode: 'new' } | { mode: 'edit'; id: string };

/**
 * Decides which view the full page should show from its URL query string:
 * `?edit=<id>` edits a preset, `?new` starts a blank one, anything else is the
 * list.
 */
export function parseEditorTarget(search: string): EditorTarget {
  const params = new URLSearchParams(search);
  const id = params.get('edit');
  if (id) return { mode: 'edit', id };
  if (params.has('new')) return { mode: 'new' };
  return { mode: 'list' };
}
