/**
 * English catalog. Its shape defines the `Messages` type, so every other locale
 * must provide exactly these keys. Placeholders use `{name}` syntax.
 */
export const en = {
  'app.name': 'Redact',

  'options.language': 'Language',

  'list.title': 'Redact presets',
  'list.empty': 'No presets yet. Add one to get started.',
  'list.addPreset': 'Add preset',
  'list.activeHere': 'Active here',
  'list.pausedHere': 'Paused here',
  'list.prev': 'Previous',
  'list.next': 'Next',
  'list.pageOf': 'Page {page} of {count}',

  'editor.newTitle': 'New preset',
  'editor.editTitle': 'Edit preset',
  'editor.back': 'Back to list',

  'preset.name': 'Name',
  'preset.namePlaceholder': 'e.g. Hide customer data',
  'preset.domains': 'Domains',
  'preset.domainsHint': 'One per line. Wildcards allowed, e.g. example.com or *.app.com',
  'preset.enabled': 'Enabled',
  'preset.rules': 'Rules',
  'preset.addRule': 'Add rule',
  'preset.save': 'Save',
  'preset.edit': 'Edit',
  'preset.delete': 'Delete',
  'preset.cancel': 'Cancel',

  'rule.selector': 'Selector',
  'rule.selectorPlaceholder': 'e.g. .secret or //div[@class="secret"]',
  'rule.selectorType': 'Type',
  'rule.typeCss': 'CSS',
  'rule.typeXpath': 'XPath',
  'rule.description': 'Description',
  'rule.descriptionPlaceholder': 'Optional note',
  'rule.remove': 'Remove',
  'rule.media': 'Redact media',
  'rule.mediaImages': 'Images',
  'rule.mediaVideo': 'Video',
  'rule.mediaEmbeds': 'Embeds',

  'popup.title': 'Redact',

  'overlay.message': 'Redacting…',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
