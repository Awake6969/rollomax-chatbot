(function() {
  'use strict';

  /* ── Capture script ref before DOM changes ─────────────────────────── */
  const _currentScript = document.currentScript;

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

    *, *::before, *::after { box-sizing: border-box; }

    /* ── Bubble button (bubble mode only) ──────────────────────────── */
    .bubble-btn {
      position: fixed;
      bottom: 90px;
      right: 24px;
      z-index: 9999;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--accent);
      border: 2px solid var(--accent);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      transition: transform 200ms ease-out, box-shadow 200ms ease-out;
      padding: 0;
      min-width: 44px;
      min-height: 44px;
      animation: pulseGlow 3s ease-in-out infinite;
    }
    .bubble-btn.is-open { animation: none; }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
      50% { box-shadow: 0 4px 16px rgba(201,169,110,0.4), 0 0 0 4px rgba(201,169,110,0.1); }
    }
    .bubble-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    }
    .bubble-btn svg { width: 28px; height: 28px; fill: currentColor; pointer-events: none; }
    .bubble-btn .close-icon { display: none; }
    .bubble-btn.is-open .chat-icon { display: none; }
    .bubble-btn.is-open .close-icon { display: block; }

    .bubble-tooltip {
      position: fixed;
      bottom: 158px;
      right: 24px;
      background: #fff;
      color: var(--primary);
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      font-size: 14px;
      font-family: var(--font-body);
      white-space: nowrap;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 300ms ease-out, transform 300ms ease-out;
      pointer-events: none;
      z-index: 9998;
    }
    .bubble-tooltip.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Chat window (bubble mode) ─────────────────────────────────── */
    .chat-window {
      position: fixed;
      bottom: 160px;
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
    :host([data-mode="inline"]) .bubble-btn { display: none; }
    :host([data-mode="inline"]) .chat-window {
      position: relative;
      bottom: auto;
      right: auto;
      width: 100%;
      height: 100%;
      min-height: 500px;
      max-width: none;
      max-height: none;
      border-radius: var(--radius);
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transform: none;
      opacity: 1;
      pointer-events: auto;
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

    /* ── Consent screen ────────────────────────────────────────────── */
    .consent-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 24px 20px;
      overflow-y: auto;
      gap: 16px;
    }
    .consent-title {
      font-size: 18px;
      font-weight: 700;
      font-family: var(--font-heading);
      color: var(--primary);
      margin: 0;
    }
    .consent-text {
      font-size: 16px;
      color: #444;
      margin: 0;
      line-height: 1.6;
    }
    .consent-link {
      color: var(--accent);
      text-decoration: underline;
      font-size: 16px;
    }
    .consent-link:hover { color: #b89555; }
    .consent-check-area {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 8px 0;
      min-height: 44px;
    }
    .consent-check-area input[type="checkbox"] {
      width: 22px;
      height: 22px;
      min-width: 22px;
      margin-top: 2px;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .consent-check-area label {
      font-size: 16px;
      color: #333;
      cursor: pointer;
      user-select: none;
    }
    .consent-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: var(--accent);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      min-height: 48px;
      transition: opacity 200ms ease-out;
      margin-top: auto;
    }
    .consent-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .consent-btn:not(:disabled):hover { opacity: 0.9; }

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
    .suggested-btn:hover {
      background: var(--accent);
      color: var(--primary);
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
      width: 36px;
      height: 36px;
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
  const ICON_REVOKE = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>';
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

  /* ── Welcome message ───────────────────────────────────────────────── */
  const WELCOME_MSG = 'Willkommen bei RolloMax Wien! Ich bin Ihr Sonnenschutz-Berater und helfe Ihnen gerne bei allen Fragen rund um Sonnenschutz. Hinweis: Dieser Chat wird von einer KI unterstuetzt. Wie kann ich Ihnen weiterhelfen?';

  const ERROR_MSG = 'Verbindungsfehler. Bitte versuchen Sie es spaeter erneut oder kontaktieren Sie uns unter +43 (0) 1 21 22 446.';

  /* ── Custom Element ────────────────────────────────────────────────── */
  class RollomaxChat extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.messages = [];
      this.isLoading = false;
      this.consentGiven = false;
      this.sessionId = null;
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

    connectedCallback() {
      this.token = this.getAttribute('data-token') || '';
      this.mode = this.getAttribute('data-mode') || 'bubble';

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
      this.checkConsent();

      if (this.mode === 'inline') {
        this.showChat();
      }

      // Tooltip timer (bubble mode, first visit only)
      if (this.mode === 'bubble' && !sessionStorage.getItem('rollomax_tooltip_shown')) {
        var self = this;
        this._tooltipTimer = setTimeout(function() {
          if (!self.isOpen && self.$tooltip) {
            self.$tooltip.classList.add('is-visible');
            sessionStorage.setItem('rollomax_tooltip_shown', 'true');
          }
        }, 5000);
      }
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

    checkConsent() {
      var consent = sessionStorage.getItem('rollomax_chat_consent');
      if (consent === 'true') {
        this.consentGiven = true;
        this.sessionId = sessionStorage.getItem('rollomax_chat_session_id') || this.generateSessionId();
        sessionStorage.setItem('rollomax_chat_session_id', this.sessionId);
      }
    }

    grantConsent() {
      this.consentGiven = true;
      sessionStorage.setItem('rollomax_chat_consent', 'true');
      sessionStorage.setItem('rollomax_chat_consent_ts', new Date().toISOString());
      this.sessionId = this.generateSessionId();
      sessionStorage.setItem('rollomax_chat_session_id', this.sessionId);
      this.switchToChat();
    }

    /* ── Render ─────────────────────────────────────────────────────── */
    render() {
      var isBubble = this.mode === 'bubble';
      this.shadowRoot.innerHTML = '<style>' + FONT_FACE_CSS + STYLES + '</style>' +
        (isBubble ? this.bubbleButtonHTML() : '') +
        this.chatWindowHTML();
    }

    bubbleButtonHTML() {
      return '<button class="bubble-btn" aria-label="Chat oeffnen">' +
        '<span class="chat-icon">' + ICON_CHAT + '</span>' +
        '<span class="close-icon">' + ICON_CLOSE + '</span>' +
        '</button>' +
        '<div class="bubble-tooltip">Fragen? Wir helfen!</div>';
    }

    chatWindowHTML() {
      var openClass = this.mode === 'inline' ? ' is-open' : '';
      return '<div class="chat-window' + openClass + '">' +
        this.headerHTML() +
        this.consentScreenHTML() +
        this.chatBodyHTML() +
        '</div>';
    }

    headerHTML() {
      var closeBtnHTML = this.mode === 'bubble'
        ? '<button class="header-btn close-btn" aria-label="Chat schliessen">' + ICON_CLOSE + '</button>'
        : '';
      var soundIcon = this._soundEnabled ? ICON_SOUND_ON : ICON_SOUND_OFF;
      return '<div class="chat-header">' +
        '<div class="chat-avatar" id="chat-avatar"><img src="/widget/avatar.png" alt="RolloMax" onerror="this.style.display=\'none\';this.parentElement.textContent=\'R\'"></div>' +
        '<div class="chat-header-title"><span class="online-dot"></span>RolloMax Berater <span class="ki-badge">KI</span></div>' +
        '<div class="header-actions">' +
          '<button class="sound-btn' + (this._soundEnabled ? '' : ' is-muted') + '" aria-label="Sound umschalten">' + soundIcon + '</button>' +
          '<button class="header-btn settings-btn" aria-label="Einstellungen">' + ICON_DOTS + '</button>' +
          closeBtnHTML +
          '<div class="settings-menu">' +
            '<button class="settings-item delete-chat-btn">' + ICON_DELETE + ' Chat-Verlauf loeschen</button>' +
            '<div class="settings-divider"></div>' +
            '<button class="settings-item revoke-consent-btn">' + ICON_REVOKE + ' Einwilligung widerrufen</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    consentScreenHTML() {
      return '<div class="consent-screen" id="consent-screen">' +
        '<h2 class="consent-title">Datenschutzhinweis</h2>' +
        '<p class="consent-text">Dieser Chat wird von einer kuenstlichen Intelligenz (KI) betrieben. Ihre Nachrichten werden verschluesselt uebertragen und nach 90 Tagen automatisch geloescht. Es werden keine personenbezogenen Daten ohne Ihre ausdrueckliche Einwilligung gespeichert.</p>' +
        '<a class="consent-link" href="https://rollomax.at/datenschutz/" target="_blank" rel="noopener">Datenschutzerklaerung</a>' +
        '<div class="consent-check-area">' +
          '<input type="checkbox" id="consent-cb">' +
          '<label for="consent-cb">Ich stimme der Verarbeitung meiner Daten gemaess der Datenschutzerklaerung zu.</label>' +
        '</div>' +
        '<button class="consent-btn" id="consent-accept-btn" disabled>Akzeptieren und Chat starten</button>' +
      '</div>';
    }

    chatBodyHTML() {
      return '<div class="messages-area hidden" id="messages-area"></div>' +
        '<div class="suggested-actions hidden" id="suggested-actions"></div>' +
        '<div class="input-area hidden" id="input-area">' +
          '<button class="upload-btn" id="upload-btn" aria-label="Bild hochladen">' + ICON_CAMERA + '</button>' +
          '<input type="file" class="upload-input" id="upload-input" accept="image/jpeg,image/png,image/webp">' +
          '<textarea id="msg-input" rows="1" placeholder="Nachricht eingeben..." aria-label="Nachricht"></textarea>' +
          '<button class="send-btn" id="send-btn" aria-label="Senden" disabled>' + ICON_SEND + '</button>' +
        '</div>' +
        '<div class="feedback-overlay" id="feedback-overlay"></div>' +
        '<div class="modal-overlay" id="modal-overlay"></div>';
    }

    /* ── Cache DOM refs ─────────────────────────────────────────────── */
    cacheElements() {
      var s = this.shadowRoot;
      this.$bubbleBtn = s.querySelector('.bubble-btn');
      this.$chatWindow = s.querySelector('.chat-window');
      this.$consentScreen = s.querySelector('#consent-screen');
      this.$consentCb = s.querySelector('#consent-cb');
      this.$consentAcceptBtn = s.querySelector('#consent-accept-btn');
      this.$messagesArea = s.querySelector('#messages-area');
      this.$suggestedActions = s.querySelector('#suggested-actions');
      this.$inputArea = s.querySelector('#input-area');
      this.$msgInput = s.querySelector('#msg-input');
      this.$sendBtn = s.querySelector('#send-btn');
      this.$settingsBtn = s.querySelector('.settings-btn');
      this.$settingsMenu = s.querySelector('.settings-menu');
      this.$closeBtn = s.querySelector('.close-btn');
      this.$deleteChatBtn = s.querySelector('.delete-chat-btn');
      this.$revokeConsentBtn = s.querySelector('.revoke-consent-btn');
      this.$tooltip = s.querySelector('.bubble-tooltip');
      this.$uploadBtn = s.querySelector('#upload-btn');
      this.$uploadInput = s.querySelector('#upload-input');
      this.$feedbackOverlay = s.querySelector('#feedback-overlay');
      this.$modalOverlay = s.querySelector('#modal-overlay');
    }

    /* ── Events ─────────────────────────────────────────────────────── */
    bindEvents() {
      var self = this;

      // Bubble button
      if (this.$bubbleBtn) {
        this.$bubbleBtn.addEventListener('click', function() { self.toggleChat(); });
      }

      // Close button
      if (this.$closeBtn) {
        this.$closeBtn.addEventListener('click', function() { self.closeChat(); });
      }

      // Consent checkbox
      this.$consentCb.addEventListener('change', function() {
        self.$consentAcceptBtn.disabled = !self.$consentCb.checked;
      });

      // Consent accept
      this.$consentAcceptBtn.addEventListener('click', function() {
        if (self.$consentCb.checked) {
          self.grantConsent();
        }
      });

      // Send button
      this.$sendBtn.addEventListener('click', function() { self.handleSend(); });

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
      this.$revokeConsentBtn.addEventListener('click', function() {
        self.closeSettings();
        self.revokeConsent();
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
    }

    /* ── Textarea auto-grow ─────────────────────────────────────────── */
    autoGrowTextarea() {
      var el = this.$msgInput;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 72) + 'px';
    }

    /* ── Toggle / Open / Close chat ─────────────────────────────────── */
    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    openChat() {
      this.isOpen = true;
      this.$chatWindow.classList.add('is-open');
      if (this.$bubbleBtn) this.$bubbleBtn.classList.add('is-open');
      if (this.$tooltip) this.$tooltip.classList.remove('is-visible');
      if (this._tooltipTimer) { clearTimeout(this._tooltipTimer); this._tooltipTimer = null; }

      if (this.consentGiven) {
        this.showChatUI();
      } else {
        this.showConsentUI();
      }
    }

    closeChat() {
      this.isOpen = false;
      this.$chatWindow.classList.remove('is-open');
      if (this.$bubbleBtn) this.$bubbleBtn.classList.remove('is-open');
      this.closeSettings();
    }

    showChat() {
      // For inline mode: auto-open
      this.isOpen = true;
      if (this.consentGiven) {
        this.showChatUI();
      } else {
        this.showConsentUI();
      }
    }

    showConsentUI() {
      this.$consentScreen.classList.remove('hidden');
      this.$messagesArea.classList.add('hidden');
      this.$suggestedActions.classList.add('hidden');
      this.$inputArea.classList.add('hidden');
    }

    showChatUI() {
      this.$consentScreen.classList.add('hidden');
      this.$messagesArea.classList.remove('hidden');
      this.$inputArea.classList.remove('hidden');

      // Send welcome message if no messages yet
      if (this.messages.length === 0) {
        this.addMessage(WELCOME_MSG, 'bot');
        this.renderSuggestedActions([
          'Rolllaeden & Raffstoren',
          'Markisen & Terrasse',
          'Kostenlose Beratung',
          'Foerderung Wien'
        ], 'quick_reply');
      }

      this.$msgInput.focus();
    }

    switchToChat() {
      this.showChatUI();
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

    generateMessageId() {
      return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderMessage(msg) {
      var self = this;
      var div = document.createElement('div');
      div.className = 'message ' + msg.role;
      div.setAttribute('data-message-id', msg.id);

      var contentHTML = '<div class="message-content">' + this.escapeHtml(msg.text) + '</div>';
      var metaHTML = '<div class="message-meta">';
      if (msg.role === 'bot') {
        metaHTML += '<span class="message-ki-badge">KI</span>';
      }
      metaHTML += '<span class="message-time">' + this.formatTime(msg.time) + '</span>';
      metaHTML += '</div>';

      var feedbackHTML = '';
      if (msg.role === 'bot') {
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

      this.$messagesArea.appendChild(div);
    }

    sendFeedback(type, data) {
      fetch(this.apiUrl + '/webhook/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Widget-Token': this.token },
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
      this.renderMessage(msg);
      this.scrollToBottom();
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

        self.submitLeadForm(name, email, phone).then(function() {
          form.innerHTML = '<div class="lead-success">Vielen Dank! Ihre Daten wurden erfolgreich uebermittelt. Wir melden uns in Kuerze bei Ihnen.</div>';
        }).catch(function() {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Absenden';
          self.addMessage(ERROR_MSG, 'bot');
        });
      });
    }

    async submitLeadForm(name, email, phone) {
      var response = await fetch(this.apiUrl + '/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-Token': this.token,
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: '__lead_form_submit__',
          consent: true,
          page_url: window.location.href,
          lead: { name: name, email: email, phone: phone }
        })
      });
      if (!response.ok) throw new Error('Lead submit failed');
      return response.json();
    }

    /* ── Send message ───────────────────────────────────────────────── */
    handleSend(overrideText, sourceType) {
      var text = overrideText || this.$msgInput.value.trim();
      if (!text || this.isLoading) return;

      this.addMessage(text, 'user');
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
      }.bind(this), 20000);

      try {
        var response = await fetch(this.apiUrl + '/webhook/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Token': this.token,
            'X-Session-ID': this.sessionId
          },
          body: JSON.stringify({
            session_id: this.sessionId,
            message: text,
            consent: true,
            page_url: window.location.href,
            source_type: sourceType || 'typed'
          }),
          signal: this._abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('HTTP ' + response.status);

        var data = await response.json();

        this.hideTypingIndicator();

        if (data.reply) {
          this.addMessage(data.reply, 'bot');
        }

        if (data.suggested_actions && data.suggested_actions.length > 0) {
          this.renderSuggestedActions(data.suggested_actions);
        }

        if (data.lead_form && data.lead_form.show === true) {
          this.renderLeadForm();
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
            'Content-Type': 'application/json',
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

      // New session
      this.sessionId = this.generateSessionId();
      sessionStorage.setItem('rollomax_chat_session_id', this.sessionId);

      // Show consent screen again
      this.consentGiven = false;
      sessionStorage.removeItem('rollomax_chat_consent');
      sessionStorage.removeItem('rollomax_chat_consent_ts');
      this.$consentCb.checked = false;
      this.$consentAcceptBtn.disabled = true;
      this.showConsentUI();
    }

    /* ── Revoke consent ─────────────────────────────────────────────── */
    async revokeConsent() {
      try {
        await fetch(this.apiUrl + '/webhook/delete-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Token': this.token
          },
          body: JSON.stringify({ session_id: this.sessionId })
        });
      } catch (_) {
        // Proceed with local cleanup
      }

      // Full cleanup
      this.messages = [];
      this.$messagesArea.innerHTML = '';
      this.$suggestedActions.innerHTML = '';
      this.$suggestedActions.classList.add('hidden');
      this.consentGiven = false;
      this.sessionId = null;
      sessionStorage.removeItem('rollomax_chat_consent');
      sessionStorage.removeItem('rollomax_chat_consent_ts');
      sessionStorage.removeItem('rollomax_chat_session_id');

      // Reset consent UI
      this.$consentCb.checked = false;
      this.$consentAcceptBtn.disabled = true;
      this.showConsentUI();
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

    function initWidget() {
      var widget = document.createElement('rollomax-chat');
      widget.setAttribute('data-token', token);
      widget.setAttribute('data-mode', mode);
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

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }
  }
})();
