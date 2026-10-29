(function() {
  'use strict';

  /* ── Capture script ref before DOM changes ─────────────────────────── */
  const _currentScript = document.currentScript;
  /* Avatar relativ zur Skriptadresse (chat.rollomax.at), nicht zur einbettenden Seite */
  const _avatarUrl = (function () { try { return new URL('avatar.jpg', (_currentScript && _currentScript.src) || location.href).href; } catch (e) { return '/widget/avatar.jpg'; } })();

  /* ── Instance registry for external API ────────────────────────────── */
  var _instances = { inline: null, bubble: null };

  /* ── CSS (all styles live inside Shadow DOM) ───────────────────────── */
  const FONT_FACE_CSS = `
    @font-face {
      font-family: 'Playfair Display';
      font-weight: 700;
      font-style: normal;
      font-display: swap;
      src: url('/widget/fonts/PlayfairDisplay-Bold.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Playfair Display';
      font-weight: 700;
      font-style: normal;
      font-display: swap;
      src: url('/widget/fonts/PlayfairDisplay-Bold-LatinExt.woff2') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    @font-face {
      font-family: 'DM Sans';
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
      src: url('/widget/fonts/DMSans-Regular.woff2') format('woff2');
    }
  `;

  const STYLES = `
    :host {
      --primary: #1F1F1F;
      --accent: #C9A96E;
      --accent-hover: #B8944F;
      --chat-bg: #FFFFFF;
      --user-bubble: #1F1F1F;
      --user-text: #FFFFFF;
      --bot-bubble: #F5F5F5;
      --bot-text: #1F1F1F;
      --online: #4CAF50;
      --font-heading: 'Playfair Display', Georgia, serif;
      --font-body: 'DM Sans', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      --font: var(--font-body);
      --radius: 16px;

      font-family: var(--font);
      font-size: 16px;
      line-height: 1.5;
      box-sizing: border-box;
    }

    :host([data-theme="service-light"]) {
      --primary: #1F1F1F;
      --accent: #e41915;
      --accent-hover: #c2110d;
      --chat-bg: #FFFFFF;
      --user-bubble: #e41915;
      --user-text: #ffffff;
      --bot-bubble: #FFFFFF;
      --bot-text: #1F1F1F;
    }

    /* Booking CTA (inline only) */
    .booking-cta { display: none; }
    :host([data-mode="inline"]) .booking-cta {
      display: block;
      padding: 18px;
      background: linear-gradient(135deg, #e41915, #b8120d);
      color: #fff;
      text-align: center;
    }
    :host([data-mode="inline"]) .booking-cta.hidden { display: none; }
    .booking-cta-title {
      font-family: var(--font-heading);
      font-size: 17px;
      font-weight: 700;
    }
    .booking-cta-sub {
      font-size: 13px;
      opacity: 0.92;
      margin: 5px 0 13px;
    }
    .booking-cta-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 13px;
      background: #fff;
      color: #e41915;
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform 150ms ease, box-shadow 150ms ease;
    }
    .booking-cta-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.22);
    }
    .booking-cta-btn svg { width: 18px; height: 18px; }

    *, *::before, *::after { box-sizing: border-box; }

    /* ── Form-Reset: WebKit vererbt Buttons/Inputs/Textareas/Links die Schrift
       des Shadow-Roots nicht automatisch (Times-Fallback fett statt DM Sans,
       iPhone-WebKit-E2E 29.10.2026); appearance:none nimmt die native
       Steuerelement-Chrome weg, die sonst Breite und Gewicht verzerrt. Klassen
       mit eigenem font-weight (z. B. .contact-btn) ueberschreiben die Basis. ── */
    button, input, textarea, select, a {
      font-family: inherit;
      font-size: inherit;
      font-weight: 400;
    }
    button, input, textarea, select {
      -webkit-appearance: none;
      appearance: none;
    }

    /* ── Quick Chat Bar (Premium Launcher) ────────────────────────── */
    .quick-chat-bar {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 20px 8px 8px;
      background: var(--primary);
      border: 1px solid rgba(201,169,110,0.3);
      border-radius: 28px;
      cursor: pointer;
      box-shadow:
        0 4px 24px rgba(0,0,0,0.25),
        0 0 0 1px rgba(201,169,110,0.1),
        inset 0 1px 0 rgba(255,255,255,0.05);
      transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 56px;
      max-width: 320px;
    }
    .quick-chat-bar:hover {
      transform: translateY(-2px);
      box-shadow:
        0 8px 32px rgba(0,0,0,0.3),
        0 0 0 1px rgba(201,169,110,0.2),
        0 0 20px rgba(201,169,110,0.15),
        inset 0 1px 0 rgba(255,255,255,0.05);
      border-color: rgba(201,169,110,0.5);
    }
    .quick-chat-bar:active {
      transform: translateY(0);
    }
    .quick-chat-bar.is-open {
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
    }

    .quick-chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent) 0%, #B8944F 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(201,169,110,0.3);
      position: relative;
    }
    @keyframes onlinePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4); }
      50% { box-shadow: 0 0 0 4px rgba(76,175,80,0); }
    }
    .quick-chat-avatar::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      background: var(--online);
      border-radius: 50%;
      border: 2px solid var(--primary);
      animation: onlinePulse 2s ease-in-out infinite;
    }
    .quick-chat-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .quick-chat-avatar-fallback {
      font-family: var(--font-heading);
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
    }

    .quick-chat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .quick-chat-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: var(--font-body);
    }
    .quick-chat-placeholder {
      font-size: 15px;
      color: rgba(255,255,255,0.7);
      font-family: var(--font-body);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quick-chat-icon {
      width: 20px;
      height: 20px;
      color: var(--accent);
      flex-shrink: 0;
      margin-left: 4px;
      opacity: 0.8;
      transition: opacity 200ms ease-out, transform 200ms ease-out;
    }
    .quick-chat-bar:hover .quick-chat-icon {
      opacity: 1;
      transform: translateX(2px);
    }
    .quick-chat-icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    /* Mobile responsive */
    @media (max-width: 400px) {
      .quick-chat-bar {
        right: 16px;
        bottom: 16px;
        max-width: calc(100vw - 32px);
        padding: 6px 16px 6px 6px;
      }
      .quick-chat-avatar {
        width: 36px;
        height: 36px;
      }
      .quick-chat-placeholder {
        font-size: 14px;
      }
    }

    /* Legacy bubble-btn class for compatibility */
    .bubble-btn { display: none; }
    .bubble-tooltip { display: none; }

    /* ── Chat window (bubble mode) ─────────────────────────────────── */
    .chat-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      z-index: 9999;
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: 80vh;
      border-radius: var(--radius);
      background: var(--chat-bg);
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 300ms ease-out, opacity 300ms ease-out;
    }
    .chat-window.is-open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Inline mode overrides ─────────────────────────────────────── */
    :host([data-mode="inline"]) .quick-chat-bar { display: none; }
    :host([data-mode="inline"]) .chat-window {
      position: relative;
      bottom: auto;
      right: auto;
      width: 100%;
      height: auto;
      min-height: 520px;
      max-height: 680px;
      max-width: none;
      border-radius: var(--radius);
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transform: none;
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Handy-Vollbild (bis 640px, Bubble-Modus): ganzes Blatt, Safe-Area ─ */
    @media (max-width: 640px) {
      :host(:not([data-mode="inline"])) .chat-window {
        bottom: 0;
        right: 0;
        left: 0;
        top: 0;
        width: 100%;
        max-width: none;
        height: 100vh;
        height: 100dvh;
        max-height: none;
        border-radius: 0;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
      :host(:not([data-mode="inline"])) .chat-header {
        flex-shrink: 0;
      }
    }

    /* ── Header ────────────────────────────────────────────────────── */
    .chat-header {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      background: var(--primary);
      color: #fff;
      flex-shrink: 0;
      gap: 8px;
      min-height: 56px;
    }
    .chat-header-title {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font-body);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .online-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--online);
      flex-shrink: 0;
    }
    .ki-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      padding: 2px 8px;
      border: 1.5px solid var(--accent);
      border-radius: 12px;
      color: var(--accent);
      line-height: 1.2;
      flex-shrink: 0;
    }
    .header-actions { display: flex; gap: 4px; align-items: center; position: relative; }
    .header-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0;
      transition: background 150ms ease-out;
    }
    .header-btn:hover { background: rgba(255,255,255,0.1); }
    .header-btn svg { width: 20px; height: 20px; fill: currentColor; pointer-events: none; }

    /* ── Settings dropdown ─────────────────────────────────────────── */
    .settings-menu {
      position: absolute;
      top: 48px;
      right: 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 220px;
      overflow: hidden;
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: opacity 200ms ease-out, transform 200ms ease-out;
      z-index: 10;
    }
    .settings-menu.is-open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .settings-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 14px 16px;
      border: none;
      background: none;
      color: var(--bot-text);
      font-size: 16px;
      font-family: var(--font);
      cursor: pointer;
      text-align: left;
      min-height: 44px;
      transition: background 150ms ease-out;
    }
    .settings-item:hover { background: var(--bot-bubble); }
    .settings-item svg { width: 18px; height: 18px; flex-shrink: 0; fill: currentColor; }
    .settings-divider { height: 1px; background: #E5E5E5; margin: 0; }

    /* ── Hinweiszeile (ersetzt die frühere Einwilligungs-Sperre) ─────── */
    .hint-line {
      flex-shrink: 0;
      padding: 10px 16px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #6b6b6b;
      background: #FAFAFA;
      border-top: 1px solid #ECECEC;
    }
    .hint-link {
      color: var(--accent);
      text-decoration: underline;
      font-weight: 600;
    }
    .hint-link:hover { color: var(--accent-hover); }

    /* ── Startknöpfe als Chips ─────────────────────────────────────── */
    .start-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 14px;
    }
    .start-chip {
      border: 1.5px solid var(--accent);
      background: #fff;
      color: var(--primary);
      border-radius: 999px;
      padding: 10px 16px;
      font-size: 14.5px;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      min-height: 44px;
      transition: background 150ms ease-out, transform 150ms ease-out;
    }
    @media (hover: hover) {
      .start-chip:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
    }

    /* ── Aufnahme-Karte (Fortschritt, Frage, Auswahlknöpfe) ──────────── */
    .intake-progress {
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.3px;
      margin: 0 0 6px;
    }
    .intake-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 4px 16px 14px;
    }
    .intake-option-btn {
      border: 1.5px solid #DDD;
      background: #fff;
      color: var(--primary);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14.5px;
      font-family: var(--font-body);
      cursor: pointer;
      min-height: 44px;
      text-align: left;
      transition: border-color 150ms ease-out, background 150ms ease-out;
    }
    /* Hover nur mit echter Maus: auf dem iPhone blieb :hover nach dem Tipp an der Stelle
       hängen und der nächste Schritt wirkte vorgewählt (WebKit-E2E 29.10.2026). */
    @media (hover: hover) {
      .intake-option-btn:hover { border-color: var(--accent); background: #FFF8F0; }
    }
    /* Nach der Auswahl: Reihe sperren statt weiter anklickbar zu lassen
       (iPhone-E2E 29.10.2026 zeigte stehengebliebene aktive Chips). */
    .intake-option-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .intake-option-btn.selected {
      border-color: var(--accent);
      background: #FFF8F0;
      font-weight: 600;
    }
    .intake-freitext {
      display: flex;
      gap: 8px;
      padding: 4px 16px 14px;
      align-items: center;
    }
    .intake-freitext input {
      flex: 1;
      min-width: 0;
      min-height: 44px;
      border: 1.5px solid #DDD;
      border-radius: 12px;
      padding: 0 14px;
      font-size: 15px;
      font-family: var(--font-body);
    }
    .intake-freitext input:focus { outline: none; border-color: var(--accent); }
    .intake-freitext input:disabled { opacity: 0.6; }
    .intake-freitext-btn {
      min-height: 44px;
      min-width: 72px;
      flex-shrink: 0;
      white-space: nowrap;
      border: none;
      border-radius: 12px;
      background: var(--accent);
      color: #fff;
      font-size: 14.5px;
      font-weight: 600;
      padding: 0 16px;
      cursor: pointer;
    }
    .intake-freitext-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .intake-skip-btn {
      border: none;
      background: none;
      color: #888;
      font-size: 13px;
      text-decoration: underline;
      cursor: pointer;
      padding: 10px 16px 14px;
      min-height: 44px;
    }
    .intake-skip-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .messhilfe-details {
      padding: 0 16px 10px;
    }
    .messhilfe-details summary {
      font-size: 13.5px;
      color: var(--accent);
      cursor: pointer;
      font-weight: 600;
      min-height: 44px;
      display: flex;
      align-items: center;
      list-style: none;
    }
    .messhilfe-details summary::-webkit-details-marker { display: none; }
    .messhilfe-details[open] summary { color: var(--accent-hover); }
    .messhilfe-text {
      font-size: 13.5px;
      color: #555;
      line-height: 1.55;
      padding: 2px 0 6px;
    }
    .intake-zwischenzahl {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 17px;
      color: var(--primary);
    }

    /* ── Kontakt-Reihe (Rückruf/Mail, unter echten Antworten) ────────── */
    .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      align-items: center;
    }
    .contact-phone {
      font-size: 13px;
      color: #666;
      width: 100%;
      margin-bottom: 2px;
    }
    .contact-phone a { color: var(--primary); font-weight: 600; text-decoration: none; }
    .contact-btn {
      flex: 1 1 0;
      min-width: 130px;
      min-height: 44px;
      border: 1.5px solid var(--accent);
      background: #fff;
      color: var(--primary);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
    }
    @media (hover: hover) {
      .contact-btn:hover { background: var(--accent); color: #fff; }
    }
    .contact-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .contact-form {
      margin-top: 10px;
      padding: 14px;
      background: var(--bot-bubble);
      border-radius: 14px;
    }
    .contact-form p { margin: 0 0 10px; font-size: 13.5px; color: #444; line-height: 1.5; }
    .contact-form input {
      width: 100%;
      min-height: 44px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      padding: 0 12px;
      font-size: 15px;
      font-family: var(--font-body);
      margin-bottom: 8px;
      box-sizing: border-box;
    }
    .contact-form input:focus { outline: none; border-color: var(--accent); }
    .contact-form-submit {
      width: 100%;
      min-height: 44px;
      border: none;
      border-radius: 10px;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
    }
    .contact-form-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Foto-Vorschau mit Entfernen (Groesse: bestehende .image-preview oben) ─ */
    .image-preview-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
      border: none;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
    }

    /* ── Messages area ─────────────────────────────────────────────── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    /* ── Message bubble ─────────────────────────────────────────────── */
    .message {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      opacity: 0;
      animation: msgAppear 200ms ease-out forwards;
    }
    @keyframes msgAppear {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .message.bot { align-self: flex-start; }
    .message.user { align-self: flex-end; }

    .message-content {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 16px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .message.bot .message-content {
      background: var(--bot-bubble);
      color: var(--bot-text);
      border-bottom-left-radius: 4px;
    }
    .message.user .message-content {
      background: var(--user-bubble);
      color: var(--user-text);
      border-bottom-right-radius: 4px;
    }

    /* Markdown formatting in messages */
    .message-content strong {
      font-weight: 700;
    }
    .message-content p {
      margin: 0 0 8px 0;
    }
    .message-content p:last-child {
      margin-bottom: 0;
    }
    .message-content ul, .message-content ol {
      margin: 8px 0;
      padding-left: 20px;
    }
    .message-content li {
      margin: 4px 0;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      padding: 0 4px;
    }
    .message.bot .message-meta { flex-direction: row; }
    .message.user .message-meta { flex-direction: row-reverse; }

    .message-time {
      font-size: 16px;
      color: #999;
    }
    .message-ki-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      padding: 2px 7px;
      border: 1.5px solid var(--accent);
      border-radius: 10px;
      color: var(--accent);
      line-height: 1.2;
    }

    /* ── Typing indicator ──────────────────────────────────────────── */
    .typing-indicator {
      align-self: flex-start;
      display: flex;
      gap: 5px;
      padding: 14px 18px;
      background: var(--bot-bubble);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
    }
    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typingPulse 1.2s ease-in-out infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes typingPulse {
      0%, 60%, 100% { opacity: 0.3; transform: scale(0.85); }
      30% { opacity: 1; transform: scale(1); }
    }

    /* ── Lead form ─────────────────────────────────────────────────── */
    .lead-form {
      align-self: flex-start;
      max-width: 90%;
      background: var(--bot-bubble);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      opacity: 0;
      animation: msgAppear 200ms ease-out forwards;
    }
    .lead-form-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
      margin: 0;
    }
    .lead-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .lead-field label {
      font-size: 16px;
      color: #666;
    }
    .lead-field input {
      padding: 10px 12px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      font-size: 16px;
      font-family: var(--font);
      outline: none;
      transition: border-color 200ms ease-out;
      min-height: 44px;
    }
    .lead-field input:focus { border-color: var(--accent); }
    .lead-submit {
      padding: 12px;
      border: none;
      border-radius: 10px;
      background: var(--accent);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      min-height: 44px;
      transition: opacity 200ms ease-out;
      margin-top: 4px;
    }
    .lead-submit:disabled { opacity: 0.45; cursor: not-allowed; }
    .lead-submit:not(:disabled):hover { opacity: 0.9; }
    .lead-success {
      font-size: 16px;
      color: #2e7d32;
      text-align: center;
      padding: 12px;
    }
    /* Anfragenummer nie mitten im Code umbrechen (Handy-E2E 29.10.2026) */
    .lead-code { white-space: nowrap; }

    /* ── Input area ────────────────────────────────────────────────── */
    .input-area {
      display: flex;
      align-items: flex-end;
      padding: 12px 16px;
      gap: 8px;
      border-top: 1px solid #E5E5E5;
      flex-shrink: 0;
      background: #fff;
    }
    .input-area textarea {
      flex: 1;
      resize: none;
      border: 1.5px solid #DDD;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 16px;
      font-family: var(--font);
      line-height: 1.5;
      outline: none;
      max-height: 72px;
      min-height: 44px;
      overflow-y: auto;
      transition: border-color 200ms ease-out;
    }
    .input-area textarea:focus { border-color: var(--accent); }
    .send-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-hover));
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: opacity 200ms ease-out;
      flex-shrink: 0;
    }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn:not(:disabled):hover { opacity: 0.85; }
    .send-btn svg { width: 20px; height: 20px; fill: currentColor; pointer-events: none; }

    /* ── Suggested actions ──────────────────────────────────────────── */
    .suggested-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px 12px;
      flex-shrink: 0;
      animation: fadeIn 300ms ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .suggested-btn {
      padding: 8px 16px;
      border: 1.5px solid var(--accent);
      border-radius: 20px;
      background: transparent;
      color: var(--accent);
      font-size: 14px;
      font-family: var(--font-body);
      cursor: pointer;
      min-height: 44px;
      transition: background 200ms ease-out, color 200ms ease-out;
    }
    @media (hover: hover) {
      .suggested-btn:hover {
        background: var(--accent);
        color: var(--primary);
      }
    }


    /* ── Avatar ────────────────────────────────────────────────────── */
    .chat-avatar {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 50%;
      background: var(--accent);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      overflow: hidden;
    }
    .chat-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ── Sound toggle ──────────────────────────────────────────────── */
    .sound-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0;
      transition: background 150ms ease-out;
    }
    .sound-btn:hover { background: rgba(255,255,255,0.1); }
    .sound-btn svg { width: 20px; height: 20px; fill: currentColor; pointer-events: none; }
    .sound-btn.is-muted { opacity: 0.5; }

    /* ── Message feedback (thumbs) ─────────────────────────────────── */
    .message-feedback {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      padding: 0 4px;
    }
    .feedback-btn {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border: none;
      background: transparent;
      color: #999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      padding: 0;
      transition: color 150ms ease-out, background 150ms ease-out;
    }
    .feedback-btn:hover { color: var(--primary); background: rgba(0,0,0,0.05); }
    .feedback-btn.selected { color: var(--accent); }
    .feedback-btn svg { width: 16px; height: 16px; fill: currentColor; pointer-events: none; }

    /* ── Typing indicator with text ────────────────────────────────── */
    .typing-text {
      font-size: 14px;
      color: #666;
      margin-right: 8px;
    }

    /* ── Product card ──────────────────────────────────────────────── */
    .product-card {
      width: 280px;
      max-width: 100%;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin: 8px 0;
    }
    .product-card-image {
      width: 100%;
      height: 140px;
      object-fit: cover;
      background: var(--bot-bubble);
    }
    .product-card-content { padding: 12px; }
    .product-card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 4px;
    }
    .product-card-desc {
      font-size: 14px;
      color: #666;
      margin: 0 0 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-card-btn {
      display: inline-block;
      padding: 8px 16px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 150ms ease-out;
    }
    .product-card-btn:hover { opacity: 0.9; }

    /* ── Image upload ──────────────────────────────────────────────── */
    .upload-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: none;
      background: transparent;
      color: #999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0;
      transition: color 150ms ease-out;
      flex-shrink: 0;
    }
    .upload-btn:hover { color: var(--accent); }
    .upload-btn svg { width: 22px; height: 22px; fill: currentColor; pointer-events: none; }
    .upload-input { display: none; }

    .image-preview {
      align-self: flex-end;
      max-width: 200px;
      margin: 8px 0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    .image-preview img { width: 100%; height: auto; display: block; }

    /* ── Action buttons ────────────────────────────────────────────── */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      font-family: var(--font);
      cursor: pointer;
      min-height: 44px;
      transition: opacity 150ms ease-out;
    }
    .action-btn svg { width: 18px; height: 18px; fill: currentColor; }
    .action-btn.primary { background: var(--accent); color: #fff; }
    .action-btn.secondary {
      background: transparent;
      border: 1.5px solid var(--accent);
      color: var(--accent);
    }
    .action-btn.whatsapp { background: #25D366; color: #fff; }
    .action-btn:hover { opacity: 0.9; }

    /* ── Session feedback overlay ──────────────────────────────────── */
    .feedback-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 300ms ease-out;
    }
    .feedback-overlay.is-visible { opacity: 1; pointer-events: auto; }
    .feedback-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 16px;
      text-align: center;
    }
    .feedback-stars { display: flex; gap: 8px; margin-bottom: 16px; }
    .feedback-star {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: #DDD;
      cursor: pointer;
      padding: 0;
      transition: color 150ms ease-out, transform 150ms ease-out;
    }
    .feedback-star:hover { transform: scale(1.1); }
    .feedback-star.active { color: #FFB800; }
    .feedback-star svg { width: 100%; height: 100%; fill: currentColor; }
    .feedback-comment {
      width: 100%;
      max-width: 300px;
      padding: 12px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      font-size: 16px;
      font-family: var(--font);
      resize: none;
      margin-bottom: 16px;
    }
    .feedback-comment:focus { border-color: var(--accent); outline: none; }
    .feedback-submit {
      padding: 12px 32px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      min-height: 48px;
      transition: opacity 150ms ease-out;
    }
    .feedback-submit:hover { opacity: 0.9; }
    .feedback-skip {
      margin-top: 12px;
      background: none;
      border: none;
      color: #999;
      font-size: 14px;
      cursor: pointer;
      min-height: 44px;
      padding: 12px 16px;
    }
    .feedback-skip:hover { color: var(--primary); }

    /* ── Modal overlay ─────────────────────────────────────────────── */
    .modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      transition: opacity 300ms ease-out;
    }
    .modal-overlay.is-visible { opacity: 1; pointer-events: auto; }
    .modal-content {
      width: 90%;
      max-width: 400px;
      max-height: 80%;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid #E5E5E5;
    }
    .modal-title { font-size: 18px; font-weight: 600; color: var(--primary); margin: 0; }
    .modal-close {
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .modal-close:hover { background: #F5F5F5; }
    .modal-close svg { width: 20px; height: 20px; fill: currentColor; }
    .modal-body { flex: 1; overflow-y: auto; padding: 16px; }
    .modal-body iframe { width: 100%; height: 400px; border: none; }

    /* ── Configurator ──────────────────────────────────────────────── */
    .config-progress { display: flex; gap: 4px; margin-bottom: 20px; }
    .config-progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #DDD;
    }
    .config-progress-dot.active { background: var(--accent); }
    .config-progress-dot.completed { background: var(--online); }
    .config-label { font-size: 16px; font-weight: 500; color: var(--primary); margin-bottom: 12px; }
    .config-options { display: flex; flex-direction: column; gap: 8px; }
    .config-option {
      padding: 14px 16px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      background: #fff;
      font-size: 16px;
      font-family: var(--font);
      text-align: left;
      cursor: pointer;
      transition: border-color 150ms ease-out;
    }
    .config-option:hover { border-color: var(--accent); }
    .config-option.selected { border-color: var(--accent); background: rgba(201,169,110,0.1); }
    .config-input {
      width: 100%;
      padding: 14px 16px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      font-size: 16px;
      font-family: var(--font);
      margin-bottom: 12px;
    }
    .config-input:focus { border-color: var(--accent); outline: none; }
    .config-nav { display: flex; gap: 8px; margin-top: 20px; }
    .config-nav button {
      flex: 1;
      padding: 14px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      min-height: 48px;
    }
    .config-back { background: #F5F5F5; border: none; color: var(--primary); }
    .config-next { background: var(--accent); border: none; color: #fff; }

    /* ── Utility ────────────────────────────────────────────────────── */
    .hidden { display: none !important; }
  `;

  /* ── SVG icons ─────────────────────────────────────────────────────── */
  const ICON_CHAT = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  const ICON_DOTS = '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  const ICON_SEND = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  const ICON_DELETE = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
  const ICON_THUMB_UP = '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';
  const ICON_THUMB_DOWN = '<svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>';
  const ICON_SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
  const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
  const ICON_CAMERA = '<svg viewBox="0 0 24 24"><path d="M12 15.2c1.77 0 3.2-1.43 3.2-3.2s-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2 1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>';
  const ICON_WHATSAPP = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  const ICON_CALENDAR = '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>';
  const ICON_STAR = '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
  const ICON_STAR_OUTLINE = '<svg viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';

  /* ── Notification Sound (base64 encoded short pling) ───────────────── */
  const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNBrP+AAAAAAAAAAAAAAAAAAAAAP/7kGQAAANUMEoFPeACNQV40KEABIEBN3mEOYACMQV3cIQgAOBAEAwSAAABhGDEOC8XB4EAQBMEAQBAMI//FocBAEAYOf/+nO//4QQBP/+Xm///hBAEAwTB8Hz//5cHwfggCAIAgOAgP+D4Pg+D4IAgD/+UdxAGCYJg+D4P/9hIDAMEwTBMFB6Hw/B//lHcQBgmCYPg+D//Y//tgxAADwAABpAAAACAAADSAAAAEP/7YMQeA8AAAaQAAAAgAAA0gAAABEAAAGkAAAAIAAANIAAAARBu+eFtaJT/+2DEJgPAAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABA=';

/* TEXTE_V2_BEGIN */
  /* Automatisch erzeugt aus data/rollomax/chat_texte_v2.json durch
     tools/rollomax_widget_texte_sync.py. Nicht händisch bearbeiten,
     sonst weicht `check` ab. */
  const TEXTE_V2 = {
  "status": "ccc",
  "hinweis": "CCC-Lauf 29.10.2026 (output/rollomax-chat-plan2-2026-10-29/ccc-texte-chatfenster.md); Freigabe durch Raphael mit der SICHT. Schlüssel und Optionswerte (wert) sind fest.",
  "begruessung": "Ihren Richtpreis erfahren Sie hier ohne Anmeldung oder Kontaktdaten. RolloMax ist ein Wiener Familienbetrieb mit eigenen Monteuren und Schauraum.",
  "hinweiszeile": "Antworten kommen automatisch per KI. Preise sind Richtwerte. Das RolloMax-Team prüft jede Anfrage. Datenschutz",
  "start_knoepfe": [
    "Preis für meine Fenster",
    "Förderung",
    "Reparatur",
    "Markise"
  ],
  "rueckruf_knopf": "Rückruf anfordern",
  "rueckruf_frage": "Das RolloMax-Team meldet sich innerhalb von 1 bis 2 Werktagen bei Ihnen. Dafür brauchen wir nur Ihren Namen und Ihre Telefonnummer.",
  "rueckruf_danke": "Danke, {vorname}! Ihre Anfrage mit der Nummer {lead_code} ist eingegangen. Das RolloMax-Team ruft Sie innerhalb von 1 bis 2 Werktagen zurück.",
  "mail_knopf": "Preisrahmen per Mail",
  "mail_frage": "Das RolloMax-Team schickt Ihnen einen kostenlosen Preisrahmen und, wo möglich, den Förderbetrag per Mail. Dafür brauchen wir nur Ihren Namen und Ihre E-Mail-Adresse.",
  "mail_danke": "Danke, {vorname}! Ihre Anfragenummer lautet {lead_code}. Das RolloMax-Team schickt Ihnen innerhalb von 1 bis 2 Werktagen den Preisrahmen und gegebenenfalls Informationen zur Förderung.",
  "aufnahme_start": "Mit ein paar kurzen Angaben zu Ihren Fenstern lässt sich der Preis besser eingrenzen. Ungefähre Angaben reichen.",
  "aufnahme_produkt": "Worum geht es bei Ihrem Vorhaben?",
  "aufnahme_masse": "Wie viele Fenster sind es und wie groß sind sie ungefähr?",
  "messhilfe": "Messen Sie die Breite und Höhe der Fensteröffnung in Zentimetern. Ungefähr reicht völlig, zum Beispiel 120 cm breit und 140 cm hoch. Vor dem Auftrag werden die Maße genau geprüft.",
  "aufnahme_einbauart": "Gibt es einen Rollladenkasten und wo sitzt er? Das beeinflusst den Preis besonders stark.",
  "aufnahme_stockwerk": "In welchem Stockwerk liegen die Fenster? Das ist für die Montage wichtig.",
  "aufnahme_antrieb": "Lieber Gurt, Kurbel oder bequem per Motor bedienen?",
  "aufnahme_fassade": "Wie sieht Ihre Hausfassade aus? Das ist für die Montage wichtig.",
  "aufnahme_plz": "Welche Postleitzahl hat das Gebäude? Damit prüfen wir Montagegebiet und mögliche Förderung.",
  "aufnahme_eigentum": "Eigentum oder Miete? Das hilft bei der Förderfrage.",
  "aufnahme_zeitwunsch": "Wann möchten Sie den Sonnenschutz ungefähr haben?",
  "aufnahme_fotos": "Zwei Fotos helfen, Rückfragen zu sparen: eines vom Fenster innen und eines von der Fassade außen. Die Fotos sind freiwillig.",
  "aufnahme_danke": "Danke für Ihre Angaben! Möchten Sie lieber einen Rückruf oder einen kostenlosen Preisrahmen per Mail? Sie entscheiden.",
  "foto_danke": "Danke für das Foto! Das RolloMax-Team sieht es sich gemeinsam mit Ihrer Anfrage an.",
  "foto_fehler": "Das Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es mit JPG oder PNG unter 8 MB.",
  "foto_aus": "Fotos können gerade nicht hochgeladen werden. Beschreiben Sie die Situation kurz im Chat oder rufen Sie uns an: +43 1 212 2446.",
  "datenschutz_satz": "Für automatische Antworten verarbeitet Anthropic Ireland, Limited, Dublin, Irland, als Auftragsverarbeiter Gesprächstexte ohne Namen, Telefonnummern, E-Mail-Adressen und Postleitzahl, auch in den USA auf Grundlage von EU-Standardvertragsklauseln. Anthropic speichert sie höchstens 30 Tage und nutzt sie nicht zum Training. Fotos, Postleitzahl, Eigentum oder Miete und Kontaktdaten erhält Anthropic nie. Fotos, Projektangaben und Gespräche liegen beim Chat-Dienstleister und werden nach 90 Tagen gelöscht.",
  "teaser_handy": "Was kostet Sonnenschutz für Ihre Fenster?",
  "optionen": {
    "produkt": [
      {
        "wert": "rollladen",
        "text": "Rollläden"
      },
      {
        "wert": "raffstore",
        "text": "Raffstoren"
      },
      {
        "wert": "insektenschutz",
        "text": "Insektenschutz"
      },
      {
        "wert": "markise",
        "text": "Markise"
      },
      {
        "wert": "anderes",
        "text": "Etwas anderes"
      }
    ],
    "einbauart": [
      {
        "wert": "vorbau",
        "text": "Kasten außen sichtbar"
      },
      {
        "wert": "unterputz",
        "text": "Kasten verdeckt im Mauerwerk"
      },
      {
        "wert": "neu",
        "text": "Noch kein Kasten"
      },
      {
        "wert": "unbekannt",
        "text": "Weiß ich nicht"
      }
    ],
    "stockwerk": [
      {
        "wert": "eg",
        "text": "Erdgeschoß"
      },
      {
        "wert": "og1",
        "text": "1. Stock"
      },
      {
        "wert": "og2_3",
        "text": "2. bis 3. Stock"
      },
      {
        "wert": "og4plus",
        "text": "4. Stock oder höher"
      }
    ],
    "antrieb": [
      {
        "wert": "gurt",
        "text": "Gurt"
      },
      {
        "wert": "kurbel",
        "text": "Kurbel"
      },
      {
        "wert": "motor",
        "text": "Motor mit Schalter"
      },
      {
        "wert": "smart",
        "text": "Funk oder Handy"
      },
      {
        "wert": "unbekannt",
        "text": "Weiß ich noch nicht"
      }
    ],
    "fassade": [
      {
        "wert": "putz",
        "text": "Verputzt"
      },
      {
        "wert": "wdvs",
        "text": "Wärmedämmung"
      },
      {
        "wert": "ziegel",
        "text": "Sichtziegel"
      },
      {
        "wert": "altbau",
        "text": "Altbau mit Stuck"
      },
      {
        "wert": "unbekannt",
        "text": "Weiß ich nicht"
      }
    ],
    "eigentum": [
      {
        "wert": "eigentum",
        "text": "Eigentum"
      },
      {
        "wert": "miete",
        "text": "Miete"
      },
      {
        "wert": "keine_angabe",
        "text": "Keine Angabe"
      }
    ],
    "zeitwunsch": [
      {
        "wert": "sofort",
        "text": "So bald wie möglich"
      },
      {
        "wert": "monate_1_3",
        "text": "In 1 bis 3 Monaten"
      },
      {
        "wert": "spaeter",
        "text": "Später"
      }
    ]
  },
  "aufnahme_zwischenzahl": "Für {produkt} liegt der erste Richtwert bei {richtwert}. Mit zwei oder drei weiteren Angaben können wir den Preis besser eingrenzen.",
  "richtwerte": {
    "rollladen": "ab ca. 400 EUR pro Fenster",
    "raffstore": "ab ca. 600 EUR pro Fenster",
    "markise": "1.500 bis 5.000 EUR je nach Größe",
    "insektenschutz": null,
    "anderes": null
  }
};
  /* TEXTE_V2_END */

    /* ── Welcome message (Wortlaut aus TEXTE_V2, Task 1) ────────────────── */
  const WELCOME_MSG = TEXTE_V2.begruessung;

  /* ── Überdachungs-Begrüßung B1 (freigegeben, Wortlaut nicht ändern) ──── */
  const UD_WELCOME_MSG = 'Was kostet Ihre neue Überdachung? Finden Sie Ihren ungefähren Preis in nur 30 Sekunden heraus. Drei kurze Fragen, und Sie wissen mehr.';

  /* ── Channel aus der Skript-URL (Staging liefert /staging/widget.js) ─── */
  function channelFromScriptUrl(url) {
    return String(url || '').indexOf('/staging/') !== -1 ? 'staging' : null;
  }
  var _widgetChannel = channelFromScriptUrl(_currentScript && _currentScript.src);

  /* ── Abfrage-Variante je Sitzung, je ein Drittel ─────────────────────── */
  var INTAKE_VARIANTS = ['keine', 'kurz', 'voll'];
  function pickVariant(randomFn) {
    var rnd = typeof randomFn === 'function' ? randomFn() : Math.random();
    var idx = Math.floor(rnd * 3);
    if (idx < 0) idx = 0;
    if (idx > 2) idx = 2;
    return INTAKE_VARIANTS[idx];
  }

  /* ── Foto vor dem Upload verkleinern (Max-Kante 1600px, JPEG 0.82) ──── */
  var FOTO_MAX_EDGE = 1600;
  var FOTO_JPEG_QUALITY = 0.82;
  function resizeImageForUpload(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var scale = Math.min(1, FOTO_MAX_EDGE / Math.max(img.width, img.height));
        var targetW = Math.max(1, Math.round(img.width * scale));
        var targetH = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        callback(canvas.toDataURL('image/jpeg', FOTO_JPEG_QUALITY), 'image/jpeg');
      };
      img.onerror = function() { callback(e.target.result, file.type); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ── Reihenfolge der Aufnahme-Fragen je Variante (Bass-Antwort Block 4) ─
     skipProdukt (F3a): Produkt ist aus dem Startknopf schon klar, Frage entfällt. */
  function buildIntakeSteps(variant, skipProdukt) {
    var kurz = ['produkt', 'einbauart', 'masse', 'plz'];
    var vollExtra = ['stockwerk', 'fassade', 'antrieb', 'fotos', 'eigentum', 'zeitwunsch'];
    var steps;
    if (variant === 'voll') {
      var idx = kurz.indexOf('masse');
      steps = kurz.slice(0, idx + 1).concat(vollExtra, kurz.slice(idx + 1));
    } else {
      steps = kurz.slice();
    }
    if (skipProdukt) {
      steps = steps.filter(function(s) { return s !== 'produkt'; });
    }
    return steps;
  }

  /* ── Startknopf -> Produkt (F3a): matcht den Knopftext gegen optionen.produkt,
     damit die Produkt-Frage entfaellt, wenn der Knopf das Produkt schon nennt
     (z. B. "Markise"). Ohne Treffer bleibt die Frage Teil der Aufnahme. ─── */
  function produktFromStartKnopf(text) {
    var options = (TEXTE_V2.optionen && TEXTE_V2.optionen.produkt) || [];
    for (var i = 0; i < options.length; i++) {
      if (options[i].text === text) return options[i];
    }
    return null;
  }

  /* ── Überdachungsseiten-Pfade (identisch zu isUdPage in tools/rollomax_ud/ud_core.js, dort nicht ändern) ─ */
  const UD_PATH_PREFIXES = [
    '/produkte/ueberdachungen',
    '/produkt/lamellendach',
    '/produkt/glasdach',
    '/produkt/faltdach',
    '/produkt/faltpergola',
    '/produkt/pergolamarkisen',
    '/produkt/pergolamarkise-perea',
    '/lamellendach-pergola-wien',
    '/ratgeber/pergola-lamellendach-oder-pergolamarkise',
  ];

  function isUdPage(pathname) {
    var path = String(pathname || '');
    if (!path) return false;
    for (var i = 0; i < UD_PATH_PREFIXES.length; i++) {
      if (path.indexOf(UD_PATH_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  const ERROR_MSG = 'Verbindungsfehler. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns unter +43 (0) 1 21 22 446.';

  /* ── Custom Element ────────────────────────────────────────────────── */
  class RollomaxChat extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.messages = [];
      this.isLoading = false;
      this.sessionId = null;
      this.variant = null;
      this._intake = null;
      this.token = null;
      this.mode = 'bubble';
      this.apiUrl = 'https://chat.rollomax.at';
      this._settingsOpen = false;
      this._abortController = null;
      this._soundEnabled = localStorage.getItem('rollomax_sound') === 'true';
      this._audio = null;
      this._feedbackShown = false;
      this._proactiveShown = false;
      this._inChatProactiveShown = false;
      this._lastActivityTime = Date.now();
      this._abVariant = null;
    }

    apiOpen() {
      if (this.mode === 'bubble' && !this.isOpen) {
        this.showChat();
      }
    }

    apiPrefill(text) {
      if (!text) return;
      this.apiOpen();
      this.handleSend(text, 'service_problem_button');
    }

    connectedCallback() {
      this.token = this.getAttribute('data-token') || '';
      this.mode = this.getAttribute('data-mode') || 'bubble';

      if (this.mode === 'inline') {
        _instances.inline = this;
      } else {
        _instances.bubble = this;
      }

      // Inject @font-face into host document (required for Shadow DOM font loading)
      if (!document.getElementById('rollomax-fonts')) {
        var fontStyle = document.createElement('style');
        fontStyle.id = 'rollomax-fonts';
        fontStyle.textContent = FONT_FACE_CSS;
        document.head.appendChild(fontStyle);
      }

      this.render();
      this.cacheElements();
      this.bindEvents();
      this.ensureSession();
      this.bindViewportKeyboardFix();

      if (this.mode === 'inline') {
        this.showChat();
      }

      this.initProactiveMessages();
    }

    /* ── Helpers ────────────────────────────────────────────────────── */
    generateSessionId() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    formatTime(date) {
      return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }

    /* ── Sitzung und Abfrage-Variante (ersetzt die frühere Einwilligung) ── */
    ensureSession() {
      this.sessionId = sessionStorage.getItem('rollomax_chat_session_id') || this.generateSessionId();
      sessionStorage.setItem('rollomax_chat_session_id', this.sessionId);

      var variant = sessionStorage.getItem('rollomax_chat_variant');
      if (INTAKE_VARIANTS.indexOf(variant) === -1) {
        variant = pickVariant();
        sessionStorage.setItem('rollomax_chat_variant', variant);
      }
      this.variant = variant;
    }

    /* ── Eingabefeld über der Tastatur sichtbar halten (iPhone, Review Focus) ── */
    bindViewportKeyboardFix() {
      var self = this;
      if (this.mode !== 'bubble' || typeof window === 'undefined' || !window.visualViewport) return;
      window.visualViewport.addEventListener('resize', function() {
        if (!self.isOpen || window.innerWidth > 640) {
          self.$chatWindow.style.height = '';
          return;
        }
        self.$chatWindow.style.height = window.visualViewport.height + 'px';
      });
    }

    /* ── Render ─────────────────────────────────────────────────────── */
    render() {
      var isBubble = this.mode === 'bubble';
      this.shadowRoot.innerHTML = '<style>' + FONT_FACE_CSS + STYLES + '</style>' +
        (isBubble ? this.bubbleButtonHTML() : '') +
        this.chatWindowHTML();
    }

    bubbleButtonHTML() {
      return '<div class="quick-chat-bar" role="button" tabindex="0" aria-label="Chat öffnen">' +
        '<div class="quick-chat-avatar">' +
          '<img src="' + _avatarUrl + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<span class="quick-chat-avatar-fallback" style="display:none">R</span>' +
        '</div>' +
        '<div class="quick-chat-content">' +
          '<span class="quick-chat-label">RolloMax Berater</span>' +
          '<span class="quick-chat-placeholder">Fragen Sie mich etwas...</span>' +
        '</div>' +
        '<div class="quick-chat-icon">' +
          '<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>' +
        '</div>' +
      '</div>';
    }

    chatWindowHTML() {
      var openClass = this.mode === 'inline' ? ' is-open' : '';
      return '<div class="chat-window' + openClass + '">' +
        this.headerHTML() +
        this.chatBodyHTML() +
        '</div>';
    }

    headerHTML() {
      var closeBtnHTML = this.mode === 'bubble'
        ? '<button class="header-btn close-btn" aria-label="Chat schließen">' + ICON_CLOSE + '</button>'
        : '';
      var soundIcon = this._soundEnabled ? ICON_SOUND_ON : ICON_SOUND_OFF;
      return '<div class="chat-header">' +
        '<div class="chat-avatar" id="chat-avatar"><img src="' + _avatarUrl + '" alt="RolloMax" onerror="this.style.display=\'none\';this.parentElement.textContent=\'R\'"></div>' +
        '<div class="chat-header-title"><span class="online-dot"></span>RolloMax Berater <span class="ki-badge">KI</span></div>' +
        '<div class="header-actions">' +
          '<button class="sound-btn' + (this._soundEnabled ? '' : ' is-muted') + '" aria-label="Sound umschalten">' + soundIcon + '</button>' +
          '<button class="header-btn settings-btn" aria-label="Einstellungen">' + ICON_DOTS + '</button>' +
          closeBtnHTML +
          '<div class="settings-menu">' +
            '<button class="settings-item delete-chat-btn">' + ICON_DELETE + ' Chat-Verlauf löschen</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    /* ── Hinweiszeile ersetzt die frühere Einwilligungs-Sperre vollständig ── */
    hintLineHTML() {
      var text = (TEXTE_V2.hinweiszeile || '').trim();
      var linked = text.replace(/Datenschutz$/, '<a class="hint-link" href="https://rollomax.at/datenschutz/" target="_blank" rel="noopener">Datenschutz</a>');
      return '<div class="hint-line" id="hint-line">' + linked + '</div>';
    }

    chatBodyHTML() {
      return '<div class="booking-cta hidden" id="booking-cta">' +
          '<div class="booking-cta-title">Direkt Termin sichern</div>' +
          '<div class="booking-cta-sub">Freie Termine diese Woche, kostenloser Kostenvoranschlag</div>' +
          '<button class="booking-cta-btn" id="booking-cta-btn" type="button">' + ICON_CALENDAR + ' Termin in 30 Sekunden buchen</button>' +
        '</div>' +
        '<div class="messages-area hidden" id="messages-area"></div>' +
        '<div class="suggested-actions hidden" id="suggested-actions"></div>' +
        '<div class="input-area hidden" id="input-area">' +
          '<button class="upload-btn" id="upload-btn" aria-label="Bild hochladen">' + ICON_CAMERA + '</button>' +
          '<input type="file" class="upload-input" id="upload-input" accept="image/jpeg,image/png,image/webp">' +
          '<textarea id="msg-input" rows="1" placeholder="Nachricht eingeben..." aria-label="Nachricht"></textarea>' +
          '<button class="send-btn" id="send-btn" aria-label="Senden" disabled>' + ICON_SEND + '</button>' +
        '</div>' +
        this.hintLineHTML() +
        '<div class="feedback-overlay" id="feedback-overlay"></div>' +
        '<div class="modal-overlay" id="modal-overlay"></div>';
    }

    /* ── Cache DOM refs ─────────────────────────────────────────────── */
    cacheElements() {
      var s = this.shadowRoot;
      this.$quickChatBar = s.querySelector('.quick-chat-bar');
      this.$chatWindow = s.querySelector('.chat-window');
      this.$hintLine = s.querySelector('#hint-line');
      this.$messagesArea = s.querySelector('#messages-area');
      this.$bookingCta = s.querySelector('#booking-cta');
      this.$bookingCtaBtn = s.querySelector('#booking-cta-btn');
      this.$suggestedActions = s.querySelector('#suggested-actions');
      this.$inputArea = s.querySelector('#input-area');
      this.$msgInput = s.querySelector('#msg-input');
      this.$sendBtn = s.querySelector('#send-btn');
      this.$settingsBtn = s.querySelector('.settings-btn');
      this.$settingsMenu = s.querySelector('.settings-menu');
      this.$closeBtn = s.querySelector('.close-btn');
      this.$deleteChatBtn = s.querySelector('.delete-chat-btn');
      this.$uploadBtn = s.querySelector('#upload-btn');
      this.$uploadInput = s.querySelector('#upload-input');
      this.$feedbackOverlay = s.querySelector('#feedback-overlay');
      this.$modalOverlay = s.querySelector('#modal-overlay');
    }

    /* ── Events ─────────────────────────────────────────────────────── */
    bindEvents() {
      var self = this;

      // Quick Chat Bar (click and keyboard)
      if (this.$quickChatBar) {
        this.$quickChatBar.addEventListener('click', function() { self.showChat(); });
        this.$quickChatBar.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            self.showChat();
          }
        });
      }

      // Close button
      if (this.$closeBtn) {
        this.$closeBtn.addEventListener('click', function() { self.closeChat(); });
      }

      // Send button
      this.$sendBtn.addEventListener('click', function() { self.handleSend(); });

      // Booking CTA (inline service-light)
      if (this.$bookingCtaBtn) {
        this.$bookingCtaBtn.addEventListener('click', function() {
          self.trackEvent('booking_cta_click');
          self.openBookingModal();
        });
      }

      // Textarea input and keyboard
      this.$msgInput.addEventListener('input', function() {
        self.autoGrowTextarea();
        self.$sendBtn.disabled = !self.$msgInput.value.trim();
      });
      this.$msgInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          self.handleSend();
        }
      });

      // Escape to close (bubble mode)
      if (this.mode === 'bubble') {
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && self.isOpen) {
            self.closeChat();
          }
        });
      }

      // Settings menu
      this.$settingsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        self.toggleSettings();
      });

      // Close settings when clicking elsewhere
      this.shadowRoot.addEventListener('click', function(e) {
        if (self._settingsOpen && !e.target.closest('.settings-menu') && !e.target.closest('.settings-btn')) {
          self.closeSettings();
        }
      });

      // Settings actions
      this.$deleteChatBtn.addEventListener('click', function() {
        self.closeSettings();
        self.deleteSession();
      });

      // Feedback buttons (delegated)
      this.$messagesArea.addEventListener('click', function(e) {
        var btn = e.target.closest('.feedback-btn');
        if (!btn) return;
        var feedbackDiv = btn.closest('.message-feedback');
        var messageId = feedbackDiv.getAttribute('data-message-id');
        var rating = btn.getAttribute('data-rating');
        feedbackDiv.querySelectorAll('.feedback-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        self.sendFeedback('message', { message_id: messageId, rating: rating });
      });

      // Sound toggle
      var soundBtn = this.shadowRoot.querySelector('.sound-btn');
      if (soundBtn) {
        soundBtn.addEventListener('click', function() {
          self._soundEnabled = !self._soundEnabled;
          localStorage.setItem('rollomax_sound', self._soundEnabled ? 'true' : 'false');
          soundBtn.innerHTML = self._soundEnabled ? ICON_SOUND_ON : ICON_SOUND_OFF;
          soundBtn.classList.toggle('is-muted', !self._soundEnabled);
          if (self._soundEnabled) { self.playNotificationSound(); }
        });
      }

      // Image upload
      if (this.$uploadBtn && this.$uploadInput) {
        this.$uploadBtn.addEventListener('click', function() {
          self.$uploadInput.click();
        });

        this.$uploadInput.addEventListener('change', function(e) {
          var file = e.target.files[0];
          if (!file) return;

          if (file.size > 5 * 1024 * 1024) {
            alert('Bild zu gross. Maximal 5MB erlaubt.');
            return;
          }
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Nur JPG, PNG oder WebP erlaubt.');
            return;
          }

          self.uploadImage(file);
          e.target.value = '';
        });
      }

      // Session feedback timer (check every 30 seconds)
      this._feedbackCheckInterval = setInterval(function() {
        if (self.isOpen && self.sessionId && !self._feedbackShown) {
          var inactiveTime = Date.now() - self._lastActivityTime;
          if (inactiveTime > 120000) {
            self.showSessionFeedback();
          }
        }
      }, 30000);

      // Modal backdrop click (delegated, once)
      this.$modalOverlay.addEventListener('click', function(e) {
        if (e.target === self.$modalOverlay) {
          self.closeModal();
        }
      });
    }

    /* ── Textarea auto-grow ─────────────────────────────────────────── */
    autoGrowTextarea() {
      var el = this.$msgInput;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 72) + 'px';
    }

    /* ── Toggle / Open / Close chat ─────────────────────────────────── */
    closeChat() {
      this.isOpen = false;
      this.$chatWindow.classList.remove('is-open');
      if (this.$quickChatBar) this.$quickChatBar.classList.remove('is-open');
      this.closeSettings();
    }

    showChat() {
      if (this._proactiveShown) {
        this.trackEvent('proactive_clicked', { variant: this._abVariant });
        this._proactiveShown = false;
      }

      this.isOpen = true;
      this.$chatWindow.classList.add('is-open');
      if (this.$quickChatBar) this.$quickChatBar.classList.add('is-open');

      this.trackEvent('chat_opened');

      this.showChatUI();
      this.focusInput();
    }

    focusInput() {
      var self = this;
      setTimeout(function() {
        if (self.$msgInput) {
          self.$msgInput.focus();
        }
      }, 350);
    }

    showChatUI() {
      this.$messagesArea.classList.remove('hidden');
      this.$inputArea.classList.remove('hidden');
      if (this.$bookingCta) this.$bookingCta.classList.remove('hidden');

      // Send welcome message if no messages yet
      if (this.messages.length === 0) {
        if (isUdPage(location.pathname)) {
          this.addMessage(UD_WELCOME_MSG, 'bot');
          this.renderSuggestedActions([
            'Lamellendach',
            'Glasdach',
            'Pergolamarkise'
          ], 'quick_reply');
        } else {
          this.addMessage(WELCOME_MSG, 'bot');
          this.renderStartChips();
        }
      }

      // Verzögert fokussieren statt sofort: der direkte .focus() hier lief dem
      // Öffnen-Übergang voraus und ließ WebKit die Seite vorzeitig scrollen,
      // sodass die erste Begrüßungszeile unter der Kopfzeile lag (iPhone-E2E
      // 29.10.2026). focusInput() (Eingabefeld über der Tastatur, Review Focus)
      // deckt den Fall mit demselben 350-ms-Timeout ab.
      this.focusInput();
    }

    /* ── Settings ───────────────────────────────────────────────────── */
    toggleSettings() {
      if (this._settingsOpen) {
        this.closeSettings();
      } else {
        this._settingsOpen = true;
        this.$settingsMenu.classList.add('is-open');
      }
    }

    closeSettings() {
      this._settingsOpen = false;
      this.$settingsMenu.classList.remove('is-open');
    }

    /* ── Messages ───────────────────────────────────────────────────── */
    escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    formatMarkdown(text) {
      if (!text) return '';
      var self = this;
      // First escape HTML to prevent XSS
      var escaped = this.escapeHtml(text);

      // Split into paragraphs (double newline or single newline)
      var paragraphs = escaped.split(/\n\n+/);
      var result = [];

      for (var i = 0; i < paragraphs.length; i++) {
        var para = paragraphs[i].trim();
        if (!para) continue;

        // Check if this paragraph is a list
        var lines = para.split(/\n/);
        var isList = lines.length > 0 && /^[-*]\s/.test(lines[0].trim());

        if (isList) {
          // Render as unordered list
          var listItems = [];
          for (var j = 0; j < lines.length; j++) {
            var line = lines[j].trim();
            if (/^[-*]\s/.test(line)) {
              var itemText = line.replace(/^[-*]\s+/, '');
              // Apply bold formatting within list item
              itemText = itemText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
              listItems.push('<li>' + itemText + '</li>');
            }
          }
          result.push('<ul>' + listItems.join('') + '</ul>');
        } else {
          // Regular paragraph - convert single newlines to <br>
          var formatted = para.replace(/\n/g, '<br>');
          // Apply bold formatting
          formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          result.push('<p>' + formatted + '</p>');
        }
      }

      return result.join('');
    }

    generateMessageId() {
      return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderMessage(msg) {
      var self = this;
      var div = document.createElement('div');
      div.className = 'message ' + msg.role;
      div.setAttribute('data-message-id', msg.id);

      // Use formatMarkdown for bot messages, escapeHtml for user messages
      var formattedText = msg.role === 'bot' ? this.formatMarkdown(msg.text) : this.escapeHtml(msg.text);
      var contentHTML = '<div class="message-content">' + formattedText + '</div>';
      var metaHTML = '<div class="message-meta">';
      if (msg.role === 'bot') {
        metaHTML += '<span class="message-ki-badge">KI</span>';
      }
      metaHTML += '<span class="message-time">' + this.formatTime(msg.time) + '</span>';
      metaHTML += '</div>';

      // Daumen nur unter freien KI-Antworten, nicht unter Aufnahme-Formularfragen
      // (iPhone-E2E 29.10.2026: Bewertung einer Pflichtfrage ergibt keinen Sinn).
      var feedbackHTML = '';
      if (msg.role === 'bot' && !(msg.extras && msg.extras.intakeStep)) {
        feedbackHTML = '<div class="message-feedback" data-message-id="' + msg.id + '">' +
          '<button class="feedback-btn" data-rating="up" aria-label="Hilfreich">' + ICON_THUMB_UP + '</button>' +
          '<button class="feedback-btn" data-rating="down" aria-label="Nicht hilfreich">' + ICON_THUMB_DOWN + '</button>' +
          '</div>';
      }

      div.innerHTML = contentHTML + metaHTML + feedbackHTML;

      if (msg.extras && msg.extras.product_card) {
        div.appendChild(this.createProductCard(msg.extras.product_card));
      }
      if (msg.extras && msg.extras.actions && msg.extras.actions.length > 0) {
        div.appendChild(this.createActionButtons(msg.extras.actions));
      }
      if (msg.extras && msg.extras.intakeStep) {
        div.appendChild(this.createIntakeCard(msg.extras.intakeStep));
      }
      if (msg.extras && msg.extras.showContact) {
        div.appendChild(this.createContactRow());
      }

      this.$messagesArea.appendChild(div);
      return div;
    }

    sendFeedback(type, data) {
      fetch(this.apiUrl + '/webhook/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Widget-Token': this.token },
        body: JSON.stringify({ session_id: this.sessionId, feedback_type: type, data: data })
      }).catch(function(err) { console.warn('Feedback send failed:', err); });
    }

    addMessage(text, role, extras) {
      var msg = {
        id: this.generateMessageId(),
        text: text,
        role: role,
        time: new Date(),
        extras: extras || {}
      };
      this.messages.push(msg);
      var el = this.renderMessage(msg);
      if (role === 'bot' && el) {
        this.scrollToMessageStart(el);
      } else {
        this.scrollToBottom();
      }
      if (role === 'bot' && this._soundEnabled) {
        this.playNotificationSound();
      }
      return msg;
    }

    scrollToBottom() {
      var area = this.$messagesArea;
      requestAnimationFrame(function() {
        area.scrollTop = area.scrollHeight;
      });
    }

    /* Bot-Nachricht: nach unten scrollen, aber nie über ihren Anfang hinaus. Sonst rutscht der
       Anfang langer Antworten (Begrüßung am iPhone) unter die Kopfzeile (WebKit-E2E 29.10.2026). */
    scrollToMessageStart(el) {
      var area = this.$messagesArea;
      requestAnimationFrame(function() {
        var bottom = area.scrollHeight - area.clientHeight;
        var start = el.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop - 12;
        area.scrollTop = Math.max(0, Math.min(bottom, start));
      });
    }

    playNotificationSound() {
      if (!this._soundEnabled) return;
      try {
        if (!this._audio) {
          this._audio = new Audio(NOTIFICATION_SOUND);
          this._audio.volume = 0.3;
        }
        this._audio.currentTime = 0;
        this._audio.play().catch(function() {});
      } catch(e) {}
    }

    /* ── Typing indicator ───────────────────────────────────────────── */
    showTypingIndicator() {
      if (this._typingEl) return;
      var el = document.createElement('div');
      el.className = 'typing-indicator';
      el.innerHTML = '<span class="typing-text">RolloMax tippt</span><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      this._typingEl = el;
      this.$messagesArea.appendChild(el);
      this.scrollToBottom();
    }

    hideTypingIndicator() {
      if (this._typingEl) {
        this._typingEl.remove();
        this._typingEl = null;
      }
    }

    /* ── Suggested actions ──────────────────────────────────────────── */
    renderSuggestedActions(actions, sourceType) {
      var self = this;
      var sType = sourceType || 'suggested_action';
      this.$suggestedActions.innerHTML = '';
      if (!actions || actions.length === 0) {
        this.$suggestedActions.classList.add('hidden');
        return;
      }
      actions.forEach(function(action) {
        var btn = document.createElement('button');
        btn.className = 'suggested-btn';
        btn.textContent = action;
        btn.addEventListener('click', function() {
          self.$suggestedActions.classList.add('hidden');
          self.handleSend(action, sType);
        });
        self.$suggestedActions.appendChild(btn);
      });
      this.$suggestedActions.classList.remove('hidden');
    }

    /* ── Startknöpfe (Chips, Texte aus TEXTE_V2) ─────────────────────── */
    renderStartChips() {
      var self = this;
      var texts = TEXTE_V2.start_knoepfe || [];
      this.$suggestedActions.innerHTML = '';
      this.$suggestedActions.classList.add('start-chips');
      texts.forEach(function(text) {
        var btn = document.createElement('button');
        btn.className = 'start-chip';
        btn.type = 'button';
        btn.textContent = text;
        btn.addEventListener('click', function() {
          self.$suggestedActions.classList.add('hidden');
          self.trackEvent('quick_reply', { value: text });
          var knownProdukt = produktFromStartKnopf(text);
          if (text === texts[0] || knownProdukt) {
            self.startIntake(knownProdukt);
          } else {
            self.handleSend(text, 'quick_reply');
          }
        });
        self.$suggestedActions.appendChild(btn);
      });
      this.$suggestedActions.classList.remove('hidden');
    }

    /* ── Aufnahme (Plan 2 Task 5, Reihenfolge aus Bass-Antwort Block 4) ──
       F3a: knownProdukt ({wert, text}) kommt vom Startknopf (z. B. "Markise")
       und ueberspringt die Produkt-Frage, die sonst immer gestellt wurde. ── */
    startIntake(knownProdukt) {
      if (this.variant === 'keine') {
        this.handleSend(knownProdukt ? knownProdukt.text : TEXTE_V2.start_knoepfe[0], 'quick_reply');
        return;
      }
      this._intake = { steps: buildIntakeSteps(this.variant, !!knownProdukt), index: 0, data: {}, produktLabel: '' };
      if (knownProdukt) {
        this._intake.data.produkt = knownProdukt.wert;
        this._intake.produktLabel = knownProdukt.text;
      }
      this.addMessage(TEXTE_V2.aufnahme_start, 'bot');
      this.renderIntakeStep();
    }

    renderIntakeStep() {
      var intake = this._intake;
      if (!intake) return;
      if (intake.index >= intake.steps.length) {
        this.finishIntake();
        return;
      }
      var step = intake.steps[intake.index];
      this.trackEvent('step_reached', { step: step, value: this.variant });
      var questionText = TEXTE_V2['aufnahme_' + step] || '';
      this.addMessage(questionText, 'bot', { intakeStep: step });
    }

    createIntakeCard(step) {
      var self = this;
      var intake = this._intake;
      var wrap = document.createElement('div');
      wrap.className = 'intake-card';

      if (intake) {
        var progress = document.createElement('p');
        progress.className = 'intake-progress';
        progress.textContent = (intake.index + 1) + ' von ' + intake.steps.length;
        wrap.appendChild(progress);
      }

      if (step === 'masse') {
        var details = document.createElement('details');
        details.className = 'messhilfe-details';
        var summary = document.createElement('summary');
        summary.textContent = 'Wie messe ich?';
        var text = document.createElement('p');
        text.className = 'messhilfe-text';
        text.textContent = TEXTE_V2.messhilfe || '';
        details.appendChild(summary);
        details.appendChild(text);
        wrap.appendChild(details);
      }

      var options = TEXTE_V2.optionen && TEXTE_V2.optionen[step];
      if (options && options.length) {
        var optWrap = document.createElement('div');
        optWrap.className = 'intake-options';
        options.forEach(function(opt) {
          var btn = document.createElement('button');
          btn.className = 'intake-option-btn';
          btn.type = 'button';
          btn.textContent = opt.text;
          btn.addEventListener('click', function() {
            // Reihe sofort sperren: WebKit hielt gewählte Chips sonst aktiv,
            // ein zweiter Antippversuch löste einen zweiten Schritt aus (iPhone-E2E 29.10.2026).
            if (optWrap.classList.contains('is-answered')) return;
            optWrap.classList.add('is-answered');
            Array.prototype.forEach.call(optWrap.querySelectorAll('.intake-option-btn'), function(b) {
              b.disabled = true;
            });
            btn.classList.add('selected');
            self.answerIntakeStep(step, opt.wert, opt.text);
          });
          optWrap.appendChild(btn);
        });
        wrap.appendChild(optWrap);
        return wrap;
      }

      if (step === 'fotos') {
        var fotoWrap = document.createElement('div');
        fotoWrap.className = 'intake-options';
        var uploadBtn = document.createElement('button');
        uploadBtn.className = 'intake-option-btn';
        uploadBtn.type = 'button';
        uploadBtn.textContent = 'Foto hochladen';
        uploadBtn.addEventListener('click', function() {
          if (self.$uploadInput) self.$uploadInput.click();
        });
        var weiterBtn = document.createElement('button');
        weiterBtn.className = 'intake-option-btn';
        weiterBtn.type = 'button';
        weiterBtn.textContent = 'Weiter';
        weiterBtn.addEventListener('click', function() {
          if (fotoWrap.classList.contains('is-answered')) return;
          fotoWrap.classList.add('is-answered');
          uploadBtn.disabled = true;
          weiterBtn.disabled = true;
          weiterBtn.classList.add('selected');
          self.answerIntakeStep(step, 'weiter', 'Weiter');
        });
        fotoWrap.appendChild(uploadBtn);
        fotoWrap.appendChild(weiterBtn);
        wrap.appendChild(fotoWrap);
        return wrap;
      }

      // Freitext-Schritte (anzahl+masse zusammen, plz) mit "Weiß ich nicht"-Ausweg
      var freiWrap = document.createElement('div');
      freiWrap.className = 'intake-freitext';
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = step === 'plz' ? 'z. B. 1190' : 'z. B. 3 Stück, ca. 120 x 140 cm';
      var sendBtn = document.createElement('button');
      sendBtn.className = 'intake-freitext-btn';
      sendBtn.type = 'button';
      sendBtn.textContent = 'Weiter';
      var answered = false;
      var lockFreitextRow = function() {
        answered = true;
        input.disabled = true;
        sendBtn.disabled = true;
        skipBtn.disabled = true;
      };
      var submit = function() {
        if (answered) return;
        var val = input.value.trim();
        if (!val) return;
        lockFreitextRow();
        self.answerIntakeStep(step, val, val);
      };
      sendBtn.addEventListener('click', submit);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
      freiWrap.appendChild(input);
      freiWrap.appendChild(sendBtn);
      wrap.appendChild(freiWrap);

      var skipBtn = document.createElement('button');
      skipBtn.className = 'intake-skip-btn';
      skipBtn.type = 'button';
      skipBtn.textContent = 'Weiß ich nicht';
      skipBtn.addEventListener('click', function() {
        if (answered) return;
        lockFreitextRow();
        self.answerIntakeStep(step, 'unbekannt', 'Weiß ich nicht');
      });
      wrap.appendChild(skipBtn);

      return wrap;
    }

    answerIntakeStep(step, value, label) {
      if (!this._intake) return;
      this._intake.data[step] = value;
      if (step === 'produkt') this._intake.produktLabel = label;
      this._lastActivityTime = Date.now();
      this.addMessage(label, 'user');
      this._intake.index += 1;

      // chat_intake-Spalte heißt masse_text, der UI-Schritt masse (tools/rollomax_chat_intake_workflow.py
      // ALLOWED_INTAKE_FIELDS); alle übrigen Schritte heißen wie die Spalte.
      var feld = step === 'masse' ? 'masse_text' : step;
      var werte = {};
      werte[feld] = value;
      this.sendIntakeStep(step, werte);

      if (step === 'masse') {
        this.maybeShowZwischenzahl();
        return;
      }
      this.renderIntakeStep();
    }

    /* ── Aufnahme-Schritt an den Server melden (Befund P261029-e19e): fire-and-
       forget wie trackEvent/submitFeedback, ein Fehler darf den Chat nie blockieren.
       Body-Form und Feldnamen aus tools/rollomax_chat_intake_workflow.py (Allowlist
       der Spalten, validate_intake_code). ───────────────────────────────────── */
    sendIntakeStep(schritt, werte) {
      if (!this.sessionId) return;
      var body = {
        session_id: this.sessionId,
        variant: this.variant || null,
        schritt: schritt,
        werte: werte || {}
      };
      fetch(this.apiUrl + '/webhook/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Widget-Token': this.token
        },
        body: JSON.stringify(body)
      }).catch(function(err) { console.warn('Intake send failed:', err); });
    }

    maybeShowZwischenzahl() {
      var produktWert = this._intake.data.produkt;
      var richtwert = TEXTE_V2.richtwerte && TEXTE_V2.richtwerte[produktWert];
      if (richtwert) {
        var produktLabel = this._intake.produktLabel || produktWert || '';
        var text = (TEXTE_V2.aufnahme_zwischenzahl || '')
          .replace('{produkt}', produktLabel)
          .replace('{richtwert}', richtwert);
        this.addMessage(text, 'bot', { showContact: true });
      }
      this.renderIntakeStep();
    }

    finishIntake() {
      this.addMessage(TEXTE_V2.aufnahme_danke, 'bot', { showContact: true });
      this._intake = null;
    }

    /* ── Kontakt-Reihe (Rückruf/Mail, gleichwertig, unter echten Antworten) ─ */
    createContactRow() {
      var self = this;
      var row = document.createElement('div');
      row.className = 'contact-row';

      var phone = document.createElement('div');
      phone.className = 'contact-phone';
      phone.innerHTML = 'Jetzt gleich anrufen: <a href="tel:+4312122446">+43 1 212 2446</a>';
      row.appendChild(phone);

      var rueckrufBtn = document.createElement('button');
      rueckrufBtn.className = 'contact-btn';
      rueckrufBtn.type = 'button';
      rueckrufBtn.textContent = TEXTE_V2.rueckruf_knopf;
      rueckrufBtn.addEventListener('click', function() {
        self.trackEvent('callback_click');
        self.openContactForm('rueckruf', row);
      });
      row.appendChild(rueckrufBtn);

      var mailBtn = document.createElement('button');
      mailBtn.className = 'contact-btn';
      mailBtn.type = 'button';
      mailBtn.textContent = TEXTE_V2.mail_knopf;
      mailBtn.addEventListener('click', function() {
        self.trackEvent('mail_offer_click');
        self.openContactForm('mail_angebot', row);
      });
      row.appendChild(mailBtn);

      return row;
    }

    openContactForm(art, afterEl) {
      var self = this;
      var isRueckruf = art === 'rueckruf';
      var form = document.createElement('div');
      form.className = 'contact-form';
      form.innerHTML =
        '<p>' + this.escapeHtml(isRueckruf ? TEXTE_V2.rueckruf_frage : TEXTE_V2.mail_frage) + '</p>' +
        '<input type="text" class="contact-name" placeholder="Ihr Name" autocomplete="name">' +
        (isRueckruf
          ? '<input type="tel" class="contact-value" placeholder="Telefonnummer" autocomplete="tel">'
          : '<input type="email" class="contact-value" placeholder="E-Mail-Adresse" autocomplete="email">') +
        '<button type="button" class="contact-form-submit">Absenden</button>';
      afterEl.insertAdjacentElement('afterend', form);
      this.scrollToBottom();
      this.trackEvent('contact_given');

      var submitBtn = form.querySelector('.contact-form-submit');
      submitBtn.addEventListener('click', function() {
        var name = form.querySelector('.contact-name').value.trim();
        var value = form.querySelector('.contact-value').value.trim();
        if (!name || !value) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet...';

        var email = isRueckruf ? '' : value;
        var phone = isRueckruf ? value : '';
        self.submitLeadForm(name, email, phone, art).then(function(data) {
          self.announceLead(data);
          var leadCode = (data && data.lead_code) || '';
          var danke = (isRueckruf ? TEXTE_V2.rueckruf_danke : TEXTE_V2.mail_danke)
            .replace('{vorname}', name.split(' ')[0])
            .replace('{lead_code}', leadCode);
          var dankeHtml = self.escapeHtml(danke);
          // Anfragenummer nie mitten im Code umbrechen (Handy-E2E 29.10.2026).
          if (leadCode) {
            dankeHtml = dankeHtml.split(self.escapeHtml(leadCode)).join('<span class="lead-code">' + self.escapeHtml(leadCode) + '</span>');
          }
          form.outerHTML = '<div class="lead-success">' + dankeHtml + '</div>';
          self.trackEvent('lead_captured', { source: art });
          // Kontakt-Knöpfe darüber sperren: blieben sonst nach erfolgreichem
          // Absenden weiter aktiv anklickbar (iPhone-E2E 29.10.2026).
          Array.prototype.forEach.call(afterEl.querySelectorAll('.contact-btn'), function(b) {
            b.disabled = true;
          });
        }).catch(function() {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Absenden';
          self.addMessage(ERROR_MSG, 'bot');
        });
      });
    }

    /* ── Lead form ──────────────────────────────────────────────────── */
    renderLeadForm() {
      var self = this;
      var form = document.createElement('div');
      form.className = 'lead-form';
      form.innerHTML =
        '<p class="lead-form-title">Kontaktdaten hinterlassen</p>' +
        '<div class="lead-field"><label for="lead-name">Name *</label><input id="lead-name" type="text" required></div>' +
        '<div class="lead-field"><label for="lead-email">E-Mail *</label><input id="lead-email" type="email" required></div>' +
        '<div class="lead-field"><label for="lead-phone">Telefon</label><input id="lead-phone" type="tel"></div>' +
        '<button class="lead-submit" id="lead-submit-btn">Absenden</button>';

      this.$messagesArea.appendChild(form);
      this.scrollToBottom();

      var submitBtn = form.querySelector('#lead-submit-btn');
      submitBtn.addEventListener('click', function() {
        var name = form.querySelector('#lead-name').value.trim();
        var email = form.querySelector('#lead-email').value.trim();
        var phone = form.querySelector('#lead-phone').value.trim();

        if (!name || !email) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet...';

        self.submitLeadForm(name, email, phone).then(function(data) {
          self.announceLead(data);
          form.innerHTML = '<div class="lead-success">Vielen Dank! Ihre Daten wurden erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.</div>';
          self.trackEvent('lead_captured', { source: 'chat' });
        }).catch(function() {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Absenden';
          self.addMessage(ERROR_MSG, 'bot');
        });
      });
    }

    async submitLeadForm(name, email, phone, art) {
      var body = {
        session_id: this.sessionId,
        message: '__lead_form_submit__',
        consent: true,
        page_url: window.location.href,
        lead: { name: name, email: email, phone: phone, art: art || 'kontakt' }
      };
      if (_widgetChannel) body.channel = _widgetChannel;
      // Kontakt-Abschluss der Aufnahme melden (Befund P261029-e19e): fire-and-forget,
      // Name/E-Mail/Telefon bleiben außen vor (nicht in ALLOWED_INTAKE_FIELDS, DSGVO).
      this.sendIntakeStep('kontakt', {});
      var response = await fetch(this.apiUrl + '/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Widget-Token': this.token,
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Lead submit failed');
      return response.json();
    }

    /* ── Send message ───────────────────────────────────────────────── */
    handleSend(overrideText, sourceType) {
      var text = overrideText || this.$msgInput.value.trim();
      if (!text || this.isLoading) return;

      this._lastActivityTime = Date.now();
      this.resetInChatProactive();
      this.addMessage(text, 'user');
      if (!this._firstMessageTracked) {
        this._firstMessageTracked = true;
        this.trackEvent('first_message');
      }
      if (!overrideText) {
        this.$msgInput.value = '';
        this.$msgInput.style.height = 'auto';
        this.$sendBtn.disabled = true;
      }
      this.$suggestedActions.classList.add('hidden');
      this.sendMessage(text, sourceType || 'typed');
    }

    async sendMessage(text, sourceType) {
      this.isLoading = true;
      this.$sendBtn.disabled = true;
      this.$msgInput.disabled = true;
      this.showTypingIndicator();

      // Abort controller for timeout
      this._abortController = new AbortController();
      var timeoutId = setTimeout(function() {
        if (this._abortController) this._abortController.abort();
      }.bind(this), 45000);

      try {
        var reqBody = {
          session_id: this.sessionId,
          message: text,
          consent: true,
          page_url: window.location.href,
          source_type: sourceType || 'typed'
        };
        if (_widgetChannel) reqBody.channel = _widgetChannel;
        var response = await fetch(this.apiUrl + '/webhook/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Widget-Token': this.token,
            'X-Session-ID': this.sessionId
          },
          body: JSON.stringify(reqBody),
          signal: this._abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('HTTP ' + response.status);

        var data = await response.json();

        this.hideTypingIndicator();

        if (data.reply) {
          this.addMessage(data.reply, 'bot', { showContact: true });
        }

        if (data.suggested_actions && data.suggested_actions.length > 0) {
          this.renderSuggestedActions(data.suggested_actions);
        }

        if (data.lead_form && data.lead_form.show === true) {
          this.renderLeadForm();
        }

        if (data.lead_code) {
          this.announceLead(data);
        }

        var productCard = data.product_card || data.show_product_card;
        if (productCard) {
          var lastMsg = this.messages[this.messages.length - 1];
          if (lastMsg) {
            lastMsg.extras = lastMsg.extras || {};
            lastMsg.extras.product_card = productCard;
            var msgEl = this.$messagesArea.querySelector('[data-message-id="' + lastMsg.id + '"]');
            if (msgEl) {
              msgEl.appendChild(this.createProductCard(productCard));
            }
          }
        }

        var actions = data.actions || data.show_actions;
        if (actions && actions.length > 0) {
          var lastMsg2 = this.messages[this.messages.length - 1];
          if (lastMsg2) {
            var msgEl2 = this.$messagesArea.querySelector('[data-message-id="' + lastMsg2.id + '"]');
            if (msgEl2) {
              msgEl2.appendChild(this.createActionButtons(actions));
            }
          }
        }

      } catch (err) {
        clearTimeout(timeoutId);
        this.hideTypingIndicator();
        this.addMessage(ERROR_MSG, 'bot');
      } finally {
        this.isLoading = false;
        this.$msgInput.disabled = false;
        this.$sendBtn.disabled = !this.$msgInput.value.trim();
        this.$msgInput.focus();
        this._abortController = null;
      }
    }

    /* ── Delete session ─────────────────────────────────────────────── */
    async deleteSession() {
      try {
        await fetch(this.apiUrl + '/webhook/delete-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Widget-Token': this.token
          },
          body: JSON.stringify({ session_id: this.sessionId })
        });
      } catch (_) {
        // Proceed with local cleanup even if API fails
      }

      // Clear messages from UI
      this.messages = [];
      this.$messagesArea.innerHTML = '';
      this.$suggestedActions.innerHTML = '';
      this.$suggestedActions.classList.add('hidden');
      this._intake = null;

      // Neue Sitzung und neue Abfrage-Variante, Chat startet sofort wieder
      this.sessionId = this.generateSessionId();
      sessionStorage.setItem('rollomax_chat_session_id', this.sessionId);
      this.variant = pickVariant();
      sessionStorage.setItem('rollomax_chat_variant', this.variant);
      this.showChatUI();
    }

    disconnectedCallback() {
      if (this._feedbackCheckInterval) {
        clearInterval(this._feedbackCheckInterval);
        this._feedbackCheckInterval = null;
      }
      if (this._proactiveTimer) {
        clearTimeout(this._proactiveTimer);
        this._proactiveTimer = null;
      }
      if (this._inChatProactiveTimer) {
        clearTimeout(this._inChatProactiveTimer);
        this._inChatProactiveTimer = null;
      }
    }

    /* ── Image upload (vorher verkleinert, siehe resizeImageForUpload) ──── */
    uploadImage(file) {
      var self = this;
      resizeImageForUpload(file, function(base64, mimeType) {
        // Vorschau mit Entfernen-Knopf im Chat
        var previewEl = self.addImagePreview(base64);

        self.showTypingIndicator();

        var body = { session_id: self.sessionId, image: base64, mime_type: mimeType };
        if (_widgetChannel) body.channel = _widgetChannel;

        fetch(self.apiUrl + '/webhook/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Widget-Token': self.token
          },
          body: JSON.stringify(body)
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          self.hideTypingIndicator();
          if (data.analysis) {
            self.addMessage(data.analysis, 'bot', { showContact: true });
          }
          self.trackEvent('image_uploaded');
        })
        .catch(function(err) {
          self.hideTypingIndicator();
          self.addMessage(TEXTE_V2.foto_fehler, 'bot');
          if (previewEl) previewEl.remove();
        });
      });
    }

    addImagePreview(base64) {
      var div = document.createElement('div');
      div.className = 'image-preview';
      var img = document.createElement('img');
      img.alt = 'Hochgeladenes Bild';
      img.src = base64;
      var removeBtn = document.createElement('button');
      removeBtn.className = 'image-preview-remove';
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', 'Foto entfernen');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function() { div.remove(); });
      div.appendChild(img);
      div.appendChild(removeBtn);
      this.$messagesArea.appendChild(div);
      this.scrollToBottom();
      return div;
    }

    /* ── Product card ───────────────────────────────────────────────── */
    createProductCard(card) {
      var div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML =
        '<img class="product-card-image" loading="lazy" src="' + this.escapeHtml(card.image || '') + '" alt="' + this.escapeHtml(card.title || '') + '" onerror="this.style.display=\'none\'">' +
        '<div class="product-card-content">' +
          '<h4 class="product-card-title">' + this.escapeHtml(card.title || '') + '</h4>' +
          '<p class="product-card-desc">' + this.escapeHtml(card.description || '') + '</p>' +
          '<a class="product-card-btn" href="' + this.escapeHtml(card.url || '#') + '" target="_blank" rel="noopener">Mehr erfahren</a>' +
        '</div>';

      var self = this;
      div.querySelector('.product-card-btn').addEventListener('click', function() {
        self.trackEvent('product_card_clicked', { product: card.type });
      });

      return div;
    }

    /* ── Action buttons ─────────────────────────────────────────────── */
    createActionButtons(actions) {
      var self = this;
      var div = document.createElement('div');
      div.className = 'action-buttons';

      actions.forEach(function(action) {
        var btn = document.createElement('button');

        switch(action) {
          case 'booking':
            btn.className = 'action-btn primary';
            btn.innerHTML = ICON_CALENDAR + ' Termin buchen';
            btn.addEventListener('click', function() {
              self.openBookingModal();
            });
            break;

          case 'whatsapp':
            btn.className = 'action-btn whatsapp';
            btn.innerHTML = ICON_WHATSAPP + ' WhatsApp Chat';
            btn.addEventListener('click', function() {
              self.openWhatsApp();
            });
            break;

          case 'configurator':
            btn.className = 'action-btn secondary';
            btn.innerHTML = 'Anfrage stellen';
            btn.addEventListener('click', function() {
              self.openConfiguratorModal();
            });
            break;

          case 'configurator_odl':
          case 'configurator_wsys':
          case 'configurator_wsysplus': {
            var lineMap = { configurator_odl: 'odl', configurator_wsys: 'wsys', configurator_wsysplus: 'wsysplus' };
            var labelMap = { configurator_odl: 'Markisen & Pergolen konfigurieren', configurator_wsys: 'Raffstoren & Rollläden konfigurieren', configurator_wsysplus: 'Fenster + Sonnenschutz konfigurieren' };
            var line = lineMap[action];
            btn.className = 'action-btn secondary';
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:5px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' + labelMap[action];
            btn.addEventListener('click', (function(l) {
              return function() { self.openKaufberater(l); };
            })(line));
            break;
          }
        }

        div.appendChild(btn);
      });

      return div;
    }

    openKaufberater(line) {
      var url = 'https://rollomax.at/kaufberater/?line=' + line;
      fetch(this.apiUrl + '/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Widget-Token': this.token,
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: '__configurator_open__',
          configurator_line: line,
          consent: true,
          page_url: window.location.href
        })
      }).catch(function() {});
      window.open(url, '_blank', 'noopener,noreferrer');
      this.trackEvent('kaufberater_opened', { line: line });
    }

    openWhatsApp() {
      var lastTopic = this.getLastTopic();
      var text = encodeURIComponent('Hallo, ich komme vom Website-Chat und haette eine Frage' + (lastTopic ? ' zu ' + lastTopic : '') + '.');
      var url = 'https://wa.me/436509907599?text=' + text;
      window.open(url, '_blank');
      this.trackEvent('whatsapp_handover');
    }

    getLastTopic() {
      var topics = ['Rollladen', 'Raffstore', 'Markise', 'Jalousie', 'Plissee', 'Insektenschutz'];
      for (var i = this.messages.length - 1; i >= 0; i--) {
        var msg = this.messages[i];
        for (var j = 0; j < topics.length; j++) {
          if (msg.text && msg.text.toLowerCase().indexOf(topics[j].toLowerCase()) !== -1) {
            return topics[j];
          }
        }
      }
      return '';
    }

    /* ── Booking: E-Mail-Anfrage ────────────────────────────────────── */
    openBookingModal() {
      window.open('mailto:team@rollomax.at?subject=Reparatur-Anfrage&body=Hallo%20RolloMax-Team%2C%0A%0Aich%20habe%20ein%20Problem%20mit%20meinem%20Rollladen%20und%20moechte%20gerne%20einen%20Reparaturtermin%20vereinbaren.%0A%0AMein%20Problem%3A%20', '_self');
      this.trackEvent('booking_started');
    }

    closeModal() {
      this.$modalOverlay.classList.remove('is-visible');
      this.$modalOverlay.innerHTML = '';
    }

    /* ── Configurator modal ─────────────────────────────────────────── */
    openConfiguratorModal() {
      var self = this;
      this._configStep = 0;
      this._configData = {};

      this._configSteps = [
        { label: 'Was suchen Sie?', options: ['Rollladen', 'Raffstore', 'Markise', 'Jalousie', 'Plissee', 'Insektenschutz', 'Anderes'] },
        { label: 'Neubau oder Nachrüstung?', options: ['Neubau', 'Nachrüstung', 'Reparatur'] },
        { label: 'Wie viele Fenster/Türen?', input: 'number', placeholder: 'z.B. 5' },
        { label: 'Ihre Postleitzahl?', input: 'text', placeholder: 'z.B. 1020' },
        { label: 'Wie erreichen wir Sie?', fields: ['name', 'email', 'phone'] }
      ];

      this.renderConfiguratorStep();
    }

    renderConfiguratorStep() {
      var self = this;
      var step = this._configSteps[this._configStep];
      var totalSteps = this._configSteps.length;

      var progressHTML = '<div class="config-progress">';
      for (var i = 0; i < totalSteps; i++) {
        var cls = i < this._configStep ? 'completed' : (i === this._configStep ? 'active' : '');
        progressHTML += '<div class="config-progress-dot ' + cls + '"></div>';
      }
      progressHTML += '</div>';

      var contentHTML = '<div class="config-label">' + this.escapeHtml(step.label) + '</div>';

      if (step.options) {
        contentHTML += '<div class="config-options">';
        step.options.forEach(function(opt) {
          contentHTML += '<button class="config-option" data-value="' + self.escapeHtml(opt) + '">' + self.escapeHtml(opt) + '</button>';
        });
        contentHTML += '</div>';
      } else if (step.input) {
        contentHTML += '<input type="' + step.input + '" class="config-input" placeholder="' + this.escapeHtml(step.placeholder || '') + '">';
      } else if (step.fields) {
        contentHTML += '<input type="text" class="config-input" placeholder="Ihr Name" data-field="name">';
        contentHTML += '<input type="email" class="config-input" placeholder="E-Mail Adresse" data-field="email">';
        contentHTML += '<input type="tel" class="config-input" placeholder="Telefonnummer" data-field="phone">';
      }

      var navHTML = '<div class="config-nav">';
      if (this._configStep > 0) {
        navHTML += '<button class="config-back">Zurueck</button>';
      }
      if (this._configStep < totalSteps - 1) {
        navHTML += '<button class="config-next">Weiter</button>';
      } else {
        navHTML += '<button class="config-next">Absenden</button>';
      }
      navHTML += '</div>';

      this.$modalOverlay.innerHTML =
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title">Anfrage stellen</h3>' +
            '<button class="modal-close">' + ICON_CLOSE + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            progressHTML +
            contentHTML +
            navHTML +
          '</div>' +
        '</div>';

      this.$modalOverlay.classList.add('is-visible');

      this.$modalOverlay.querySelector('.modal-close').addEventListener('click', function() {
        self.closeModal();
      });

      var backBtn = this.$modalOverlay.querySelector('.config-back');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          self._configStep--;
          self.renderConfiguratorStep();
        });
      }

      var nextBtn = this.$modalOverlay.querySelector('.config-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          self.saveConfiguratorStep();
        });
      }

      this.$modalOverlay.querySelectorAll('.config-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
          self.$modalOverlay.querySelectorAll('.config-option').forEach(function(o) {
            o.classList.remove('selected');
          });
          opt.classList.add('selected');
        });
      });
    }

    saveConfiguratorStep() {
      var step = this._configSteps[this._configStep];

      if (step.options) {
        var selected = this.$modalOverlay.querySelector('.config-option.selected');
        if (!selected) {
          alert('Bitte wählen Sie eine Option.');
          return;
        }
        this._configData['step' + this._configStep] = selected.getAttribute('data-value');
      } else if (step.input) {
        var input = this.$modalOverlay.querySelector('.config-input');
        if (!input.value.trim()) {
          alert('Bitte fuellen Sie das Feld aus.');
          return;
        }
        this._configData['step' + this._configStep] = input.value.trim();
      } else if (step.fields) {
        var name = this.$modalOverlay.querySelector('[data-field="name"]').value.trim();
        var email = this.$modalOverlay.querySelector('[data-field="email"]').value.trim();
        var phone = this.$modalOverlay.querySelector('[data-field="phone"]').value.trim();

        if (!name || (!email && !phone)) {
          alert('Bitte geben Sie Ihren Namen und mindestens E-Mail oder Telefon an.');
          return;
        }
        this._configData.name = name;
        this._configData.email = email;
        this._configData.phone = phone;
      }

      if (this._configStep < this._configSteps.length - 1) {
        this._configStep++;
        this.renderConfiguratorStep();
      } else {
        this.submitConfigurator();
      }
    }

    submitConfigurator() {
      var self = this;

      fetch(this.apiUrl + '/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Widget-Token': this.token,
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: 'Neue Anfrage via Konfigurator: ' + (this._configData.step0 || '') + ', ' + (this._configData.step1 || ''),
          consent: true,
          lead: {
            name: this._configData.name || '',
            email: this._configData.email || '',
            phone: this._configData.phone || '',
            interest: this._configData.step0 || '',
            project_type: this._configData.step1 || '',
            quantity: this._configData.step2 || '',
            plz: this._configData.step3 || ''
          }
        })
      }).catch(function() {});

      this.closeModal();
      this.addMessage('Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze bei Ihnen.', 'bot');
      this.trackEvent('configurator_completed', { product: this._configData.step0 });
    }

    /* ── Session feedback ───────────────────────────────────────────── */
    showSessionFeedback() {
      if (this._feedbackShown) return;
      if (this.messages.filter(function(m) { return m.role === 'bot'; }).length < 3) return;

      this._feedbackShown = true;
      this._selectedStars = 0;

      var starsHTML = '';
      for (var i = 1; i <= 5; i++) {
        starsHTML += '<button class="feedback-star" data-star="' + i + '">' + ICON_STAR_OUTLINE + '</button>';
      }

      this.$feedbackOverlay.innerHTML =
        '<h3 class="feedback-title">Wie war Ihre Erfahrung?</h3>' +
        '<div class="feedback-stars">' + starsHTML + '</div>' +
        '<textarea class="feedback-comment" rows="3" placeholder="Was können wir verbessern? (optional)"></textarea>' +
        '<button class="feedback-submit">Absenden</button>' +
        '<button class="feedback-skip">Überspringen</button>';

      this.$feedbackOverlay.classList.add('is-visible');

      var self = this;

      this.$feedbackOverlay.querySelectorAll('.feedback-star').forEach(function(star) {
        star.addEventListener('click', function() {
          self._selectedStars = parseInt(star.getAttribute('data-star'));
          self.updateFeedbackStars();
        });
      });

      this.$feedbackOverlay.querySelector('.feedback-submit').addEventListener('click', function() {
        if (self._selectedStars === 0) {
          alert('Bitte wählen Sie eine Bewertung.');
          return;
        }
        var comment = self.$feedbackOverlay.querySelector('.feedback-comment').value.trim();
        self.sendFeedback('session', { stars: self._selectedStars, comment: comment });
        self.trackEvent('feedback_submitted', { stars: self._selectedStars });
        self.closeFeedbackOverlay();
      });

      this.$feedbackOverlay.querySelector('.feedback-skip').addEventListener('click', function() {
        self.closeFeedbackOverlay();
      });
    }

    updateFeedbackStars() {
      var self = this;
      this.$feedbackOverlay.querySelectorAll('.feedback-star').forEach(function(star, i) {
        var starNum = i + 1;
        star.innerHTML = starNum <= self._selectedStars ? ICON_STAR : ICON_STAR_OUTLINE;
        star.classList.toggle('active', starNum <= self._selectedStars);
      });
    }

    closeFeedbackOverlay() {
      this.$feedbackOverlay.classList.remove('is-visible');
      this.$feedbackOverlay.innerHTML = '';
    }

    /* ── Proactive messages ─────────────────────────────────────────── */
    initProactiveMessages() {
      var self = this;

      var variants = {
        'A': 'Kann ich Ihnen bei etwas helfen?',
        'B': 'Sind Sie sich unsicher, was bei Ihnen passt?',
        'C': 'Soll ich Ihnen einen Vorschlag machen?',
        'D': 'Haben Sie Fragen zum Sonnenschutz?'
      };

      this._abVariant = sessionStorage.getItem('rollomax_ab_variant');
      if (!this._abVariant) {
        var keys = Object.keys(variants);
        this._abVariant = keys[Math.floor(Math.random() * keys.length)];
        sessionStorage.setItem('rollomax_ab_variant', this._abVariant);
      }

      if (this.mode === 'bubble' && !sessionStorage.getItem('rollomax_proactive_shown')) {
        var delay = 45000 + Math.random() * 15000;

        this._proactiveTimer = setTimeout(function() {
          if (!self.isOpen && !self._proactiveShown && self.$quickChatBar) {
            var placeholder = self.$quickChatBar.querySelector('.quick-chat-placeholder');
            if (placeholder) {
              placeholder.textContent = variants[self._abVariant];
              placeholder.style.color = 'rgba(255,255,255,0.9)';
            }
            self._proactiveShown = true;
            sessionStorage.setItem('rollomax_proactive_shown', 'true');
            self.trackEvent('proactive_shown', { variant: self._abVariant });
          }
        }, delay);
      }
    }

    resetInChatProactive() {
      var self = this;
      if (this._inChatProactiveTimer) {
        clearTimeout(this._inChatProactiveTimer);
      }

      this._inChatProactiveTimer = setTimeout(function() {
        if (self.isOpen && self.sessionId && !self._inChatProactiveShown) {
          self._inChatProactiveShown = true;
          self.addMessage('Kann ich Ihnen noch bei etwas helfen?', 'bot');
        }
      }, 90000);
    }

    /* ── Analytics tracking ─────────────────────────────────────────── */
    trackEvent(eventType, eventData) {
      if (!this.sessionId) return;

      // Widget-Namen auf die Allowlist des Track-Endpunkts abbilden; alles andere
      // bleibt lokal. Keine Personendaten, Klick-ID nur als ja/nein.
      var EVENT_MAP = {
        proactive_shown: 'teaser_shown',
        chat_opened: 'chat_opened',
        first_message: 'first_message',
        quick_reply: 'quick_reply',
        configurator_completed: 'step_reached',
        step_reached: 'step_reached',
        image_uploaded: 'photo_uploaded',
        contact_given: 'contact_given',
        lead_captured: 'lead_captured',
        booking_cta_click: 'callback_click',
        booking_started: 'callback_click',
        callback_click: 'callback_click',
        mail_offer_click: 'mail_offer_click',
        form_link_click: 'form_link_click',
        kaufberater_opened: 'kaufberater_click'
      };
      var event = EVENT_MAP[eventType];
      if (!event) return;

      var data = eventData || {};
      var params = new URLSearchParams(window.location.search || '');
      var clip = function(v) {
        return v === undefined || v === null || v === '' ? null : String(v).slice(0, 200);
      };
      var rawValue = data.value || data.product || data.line || data.variant || data.source || null;
      var payload = {
        session_id: this.sessionId,
        event: event,
        step: clip(data.step || (event === 'step_reached' ? eventType : null)),
        value: clip(rawValue),
        hero_variant: clip(document.documentElement.dataset.heroVariant),
        page_path: clip(window.location.pathname),
        utm_source: clip(params.get('utm_source')),
        utm_medium: clip(params.get('utm_medium')),
        utm_campaign: clip(params.get('utm_campaign')),
        gclid_present: !!(params.get('gclid') || params.get('gbraid') || params.get('wbraid'))
      };

      fetch(this.apiUrl + '/webhook/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Widget-Token': this.token
        },
        body: JSON.stringify(payload)
      }).catch(function() {});
    }

    /* ── Lead-Kennung an die Website melden (Ads-Conversion) ────────── */
    announceLead(data) {
      var code = data && data.lead_code;
      if (typeof code !== 'string' || !code) return;
      this._announcedLeads = this._announcedLeads || {};
      if (this._announcedLeads[code]) return;
      this._announcedLeads[code] = true;
      try {
        window.dispatchEvent(new CustomEvent('rollomax:chat-lead', { detail: { leadCode: code } }));
      } catch (e) {}
    }

  }

  /* ── Register custom element ───────────────────────────────────────── */
  if (!customElements.get('rollomax-chat')) {
    customElements.define('rollomax-chat', RollomaxChat);
  }

  /* ── Auto-init from <script> tag ───────────────────────────────────── */
  var script = _currentScript;
  if (script) {
    var token = script.getAttribute('data-token') || '';
    var mode = script.getAttribute('data-mode') || 'bubble';
    var container = script.getAttribute('data-container') || '';
    var theme = script.getAttribute('data-theme') || '';

    function initWidget() {
      var widget = document.createElement('rollomax-chat');
      widget.setAttribute('data-token', token);
      widget.setAttribute('data-mode', mode);
      if (theme) widget.setAttribute('data-theme', theme);
      if (container) widget.setAttribute('data-container', container);

      if (mode === 'inline' && container) {
        var target = document.querySelector(container);
        if (target) {
          target.appendChild(widget);
        } else {
          console.warn('[RolloMax] Container not found: ' + container);
        }
      } else {
        document.body.appendChild(widget);
      }
    }

    if (!window.RolloMaxChat) {
      window.RolloMaxChat = {
        open: function() {
          var inst = _instances.inline || _instances.bubble;
          if (inst) inst.apiOpen();
        },
        prefill: function(text) {
          var inst = _instances.inline || _instances.bubble;
          if (inst) inst.apiPrefill(text);
        }
      };
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }
  }
})();
