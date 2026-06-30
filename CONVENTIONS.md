# Code Conventions

This is a friendly guide to how we write code in this repository. It is meant to be read top to bottom the first time, and skimmed later. Each section explains a convention and, more importantly, *why* it exists, so you can apply judgment rather than follow rules blindly. The spirit is pragmatic, not dogmatic: when a rule and good sense disagree, prefer good sense and leave a note.

## Test-driven, in that order

We build each unit in three steps, and we do them in this order on purpose:

1. **Skeleton.** Write the types and the function or class signatures first, with bodies that just `throw new Error('not implemented')`. This fixes the contract — what goes in, what comes out — before any behavior exists.
2. **Tests.** Write tests that describe the correct behavior against those signatures. Run them and watch them fail. A test you have never seen fail is a test you do not trust.
3. **Implementation.** Fill in the bodies until the tests pass, then clean up.

Tests live right next to the code they cover, mirroring the source tree, named `*.test.ts`:

```
src/core/domain-match.ts        →  src/core/domain-match.test.ts
src/engine/strategies/whole.ts  →  src/engine/strategies/whole.test.ts
```

We unit-test the parts that are pure logic (domain matching, selector matching, the redaction strategies, translation, registration derivation). Some things genuinely cannot be unit-tested — most importantly the "nothing paints before we hide the page" timing guarantee. We do not pretend otherwise; those are checked by hand (see `README.md`).

## One job per piece

Every module, function, and class should do one thing. A good smell test: if you have to put "and" in a name to describe it honestly, it probably wants to be two things. For example `fouc.ts` only hides and reveals the page; `domain-match.ts` only deals with domains; `registration.ts` only syncs content-script registrations.

Prefer plain functions and small pure helpers. Reach for a class only when state and behavior genuinely belong together. Most of this codebase is functions, and that is by design — they are the easiest things to test and reason about.

## Layers point in one direction

The folders form layers, and dependencies only ever point one way:

- `src/core/` — types, storage, domain matching, registration, permissions. **No DOM here.** This is plain data and browser-extension plumbing.
- `src/engine/` — the redaction machinery (overlay, selectors, redactor, observer, strategies). It may use `core`, but it must never import UI.
- `src/i18n/` — translation. Self-contained.
- `entrypoints/` — the background script, content script, and Svelte UI. This is the only layer that wires everything together.

If you find yourself wanting `core` to import something from the DOM or the UI, that is a sign the logic is in the wrong place.

## Keep the logic pure, push side effects to the edges

The interesting decisions — does this hostname match this domain, what does this text become when redacted, which match patterns does this preset produce — are written as **pure functions**: same input, same output, no side effects. Pure functions are trivial to test and hard to break.

The messy parts that touch the outside world (the DOM, storage, the scripting API, permission prompts) are wrapped in **thin, clearly named functions**. We keep those wrappers small so the part that is hard to test stays small.

## TypeScript, used strictly

`strict` is on, along with `noUncheckedIndexedAccess` (so `array[i]` is `T | undefined` and you have to think about the empty case) and `verbatimModuleSyntax` (so type-only imports must say `import type`). Avoid `any`. When data crosses a boundary we do not control — a value read from storage, a browser API result — type it as `unknown` and narrow it deliberately.

## Imports: explicit for our code

Import our own modules with explicit relative paths (`../core/storage`). It makes the dependency graph obvious and keeps things honest.

The one exception is WXT's own framework helpers — `defineBackground`, `defineContentScript`, `browser`, and `storage`. Those come from WXT's auto-import / the `#imports` virtual module, which is the documented and test-supported path. We let those stay implicit because fighting the framework there buys nothing.

## Names should tell the truth

Use names that reveal intent. Booleans read as questions (`isHidden`, `hasXpathRules`). Skip abbreviations unless they are universally understood. A reader should be able to guess what something does from its name before reading its body.

## Comment the "why", never the "what"

Write a comment only when the code cannot explain itself — a non-obvious decision, a browser quirk, a workaround. Never narrate what the code plainly does. And write every comment in plain English that stands on its own: a future reader with only this file in front of them should fully understand it, with no reference to a chat, a ticket, or a pull request that they cannot see. If a comment would only make sense to someone who watched it being written, rewrite it.

## Do not abstract before you have to

There is exactly one deliberate extensibility seam in this codebase: the redaction **strategy registry**, because we always knew more redaction styles were coming. Everywhere else, resist adding indirection until a second caller actually exists. Speculative flexibility is just complexity you pay for now and might never use.

## All user-facing text goes through i18n

No hard-coded strings in the UI. Every visible label comes from a message catalog through the `t()` helper. Each locale must provide exactly the same keys as the English catalog (`en` defines the key type, so TypeScript enforces this). Remember the loading overlay text is user-facing too, so it is localized as well.

When adding a string: add the key to `src/i18n/messages/en.ts`, then add the translation to every other locale file. The build will not type-check until they all match.

## Never mutate what storage gives you

When you read a value from storage, treat it as read-only. Build a new array or object instead of mutating in place:

```ts
// Good — a new array
const next = [...presets, preset];

// Bad — mutates the cached value
presets.push(preset);
```

This is not just style. WXT caches the stored value and detects changes by reference; mutating it in place can make a change look like no change, and watchers silently never fire. We learned this the hard way.

## Redaction must never leak

This extension exists to hide data, so the safe failure is always "hide more", never "show the secret":

- If a rule names a strategy we do not recognize, fall back to fully blocking the text. An unknown strategy must never mean "leave it visible".
- Redact by replacing the text of text nodes. Never rewrite `innerHTML` — that destroys structure and event listeners and breaks pages.
- Redaction runs more than once (the observer re-scans added subtrees), so it must be **idempotent**, and it must not trigger itself into a loop. We mark redacted text nodes and skip them.

## The page must always come back

The content script hides the whole page before anything paints, then reveals it once redaction is done. The hard rule: **the page must always be revealed**, no matter what. That means the work is wrapped in `try/finally`, `reveal()` is idempotent, and there is an independent timeout failsafe. A brief blank-with-overlay flash is acceptable; a page stuck blank forever is not. The synchronous hide is the load-bearing mechanism here — be very careful editing it.

## Dependencies

Add dependencies with package-manager commands at their latest version (`npm install <pkg>@latest`), not by hand-editing `package.json` with a guessed number. When an install reports a deprecation or vulnerability, fix what can be fixed — upgrade the direct dependency, or pin a transitive one through `overrides` — and explain anything that genuinely cannot be fixed rather than ignoring it.

## Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/): a `type(scope): subject` header (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), an imperative subject, and a body that explains the why. Commits are GPG-signed (see `AGENTS.md` for the signing-key detail). End commit messages with the `Co-Authored-By` trailer when applicable.
