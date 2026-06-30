export interface FoucOptions {
  /** Document to operate on. Defaults to the global document. */
  doc?: Document;
  /** Text shown in the loading overlay. */
  message?: string;
  /** Auto-reveal after this many ms so a hang or error can never leave the page hidden forever. */
  failsafeMs?: number;
  /** Called once, the first time the page is revealed. */
  onReveal?: () => void;
}

export interface FoucController {
  /** Hides page content and shows the loading overlay. Idempotent. */
  hide(): void;
  /** Removes the overlay and reveals page content. Idempotent. */
  reveal(): void;
  readonly isHidden: boolean;
}

export const OVERLAY_ID = '__redact_overlay__';
export const HIDING_CLASS = '__redact_hiding__';
const STYLE_ID = '__redact_hiding_style__';
const SPINNER_CLASS = '__redact_spinner__';
const DEFAULT_MESSAGE = 'Redacting…';
const DEFAULT_FAILSAFE_MS = 4000;

function styleText(): string {
  return `
    html.${HIDING_CLASS} > :not(#${OVERLAY_ID}) { visibility: hidden !important; }
    #${OVERLAY_ID} {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; visibility: visible !important;
      background: #1e1e1e; color: #d4d4d4;
      font: 14px/1.4 system-ui, -apple-system, sans-serif;
    }
    #${OVERLAY_ID} .${SPINNER_CLASS} {
      width: 28px; height: 28px; border-radius: 50%;
      border: 3px solid #444; border-top-color: #d4d4d4;
      animation: __redact_spin__ 0.8s linear infinite;
    }
    @keyframes __redact_spin__ { to { transform: rotate(360deg); } }
  `;
}

/**
 * Hides the page behind a loading overlay until redaction completes, then
 * reveals it. The hide is synchronous so nothing paints before it takes effect;
 * a timeout failsafe guarantees the page is never left permanently hidden.
 */
export function createFoucController(options: FoucOptions = {}): FoucController {
  const doc = options.doc ?? document;
  const message = options.message ?? DEFAULT_MESSAGE;
  const failsafeMs = options.failsafeMs ?? DEFAULT_FAILSAFE_MS;
  const onReveal = options.onReveal;

  let hidden = false;
  let revealed = false;
  let failsafeTimer: ReturnType<typeof setTimeout> | undefined;

  function buildOverlay(): HTMLDivElement {
    const overlay = doc.createElement('div');
    overlay.id = OVERLAY_ID;
    const spinner = doc.createElement('div');
    spinner.className = SPINNER_CLASS;
    const label = doc.createElement('div');
    label.textContent = message;
    overlay.append(spinner, label);
    return overlay;
  }

  function hide(): void {
    if (hidden || revealed) return;
    hidden = true;
    const root = doc.documentElement;
    root.classList.add(HIDING_CLASS);
    if (!doc.getElementById(STYLE_ID)) {
      const style = doc.createElement('style');
      style.id = STYLE_ID;
      style.textContent = styleText();
      root.appendChild(style);
    }
    if (!doc.getElementById(OVERLAY_ID)) {
      root.appendChild(buildOverlay());
    }
    failsafeTimer = setTimeout(reveal, failsafeMs);
  }

  function reveal(): void {
    if (!hidden || revealed) return;
    revealed = true;
    hidden = false;
    if (failsafeTimer !== undefined) clearTimeout(failsafeTimer);
    doc.documentElement.classList.remove(HIDING_CLASS);
    doc.getElementById(STYLE_ID)?.remove();
    doc.getElementById(OVERLAY_ID)?.remove();
    onReveal?.();
  }

  return {
    hide,
    reveal,
    get isHidden() {
      return hidden;
    },
  };
}
