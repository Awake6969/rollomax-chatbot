(function() {
  'use strict';

  /* ── Capture script ref before DOM changes ─────────────────────────── */
  const _currentScript = document.currentScript;

  /* ── CSS (all styles live inside Shadow DOM) ───────────────────────── */
  const STYLES = `
    :host {
      --primary: #1F1F1F;
      --accent: #C9A96E;
      --chat-bg: #FFFFFF;
      --user-bubble: #1F1F1F;
      --user-text: #FFFFFF;
      --bot-bubble: #F5F5F5;
      --bot-text: #1F1F1F;
      --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
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
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      transition: transform 200ms ease-out, box-shadow 200ms ease-out;
      padding: 0;
      min-width: 44px;
      min-height: 44px;
    }
    .bubble-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    }
    .bubble-btn svg { width: 28px; height: 28px; fill: currentColor; pointer-events: none; }
    .bubble-btn .close-icon { display: none; }
    .bubble-btn.is-open .chat-icon { display: none; }
    .bubble-btn.is-open .close-icon { display: block; }

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
      display: flex;
      align-items: center;
      gap: 8px;
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
      background: var(--accent);
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
      padding: 0 16px 12px;
      flex-shrink: 0;
    }
    .suggested-btn {
      padding: 8px 16px;
      border: 1.5px solid var(--accent);
      border-radius: 20px;
      background: transparent;
      color: var(--accent);
      font-size: 16px;
      font-family: var(--font);
      cursor: pointer;
      min-height: 44px;
      transition: background 200ms ease-out, color 200ms ease-out;
    }
    .suggested-btn:hover {
      background: var(--accent);
      color: #fff;
    }

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

  /* ── Welcome message ───────────────────────────────────────────────── */
  const WELCOME_MSG = 'Willkommen bei RolloMax Wien! Ich bin der KI-Assistent und helfe Ihnen gerne bei Fragen rund um Sonnenschutz, unsere Produkte und Services. Wie kann ich Ihnen weiterhelfen?';

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
    }

    connectedCallback() {
      this.token = this.getAttribute('data-token') || '';
      this.mode = this.getAttribute('data-mode') || 'bubble';
      this.render();
      this.cacheElements();
      this.bindEvents();
      this.checkConsent();

      if (this.mode === 'inline') {
        this.showChat();
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
      this.shadowRoot.innerHTML = '<style>' + STYLES + '</style>' +
        (isBubble ? this.bubbleButtonHTML() : '') +
        this.chatWindowHTML();
    }

    bubbleButtonHTML() {
      return '<button class="bubble-btn" aria-label="Chat oeffnen">' +
        '<span class="chat-icon">' + ICON_CHAT + '</span>' +
        '<span class="close-icon">' + ICON_CLOSE + '</span>' +
        '</button>';
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
      return '<div class="chat-header">' +
        '<div class="chat-header-title">RolloMax KI-Assistent <span class="ki-badge">KI</span></div>' +
        '<div class="header-actions">' +
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
          '<textarea id="msg-input" rows="1" placeholder="Nachricht eingeben..." aria-label="Nachricht"></textarea>' +
          '<button class="send-btn" id="send-btn" aria-label="Senden" disabled>' + ICON_SEND + '</button>' +
        '</div>';
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
    addMessage(text, role) {
      var msg = { text: text, role: role, time: new Date() };
      this.messages.push(msg);
      this.renderMessage(msg);
    }

    renderMessage(msg) {
      var div = document.createElement('div');
      div.className = 'message ' + msg.role;

      var content = document.createElement('div');
      content.className = 'message-content';
      content.textContent = msg.text;
      div.appendChild(content);

      var meta = document.createElement('div');
      meta.className = 'message-meta';

      if (msg.role === 'bot') {
        var badge = document.createElement('span');
        badge.className = 'message-ki-badge';
        badge.textContent = 'KI';
        meta.appendChild(badge);
      }

      var time = document.createElement('span');
      time.className = 'message-time';
      time.textContent = this.formatTime(msg.time);
      meta.appendChild(time);

      div.appendChild(meta);
      this.$messagesArea.appendChild(div);
      this.scrollToBottom();
    }

    scrollToBottom() {
      var area = this.$messagesArea;
      requestAnimationFrame(function() {
        area.scrollTop = area.scrollHeight;
      });
    }

    /* ── Typing indicator ───────────────────────────────────────────── */
    showTypingIndicator() {
      if (this._typingEl) return;
      var el = document.createElement('div');
      el.className = 'typing-indicator';
      el.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
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
    renderSuggestedActions(actions) {
      var self = this;
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
          self.handleSend(action);
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
    handleSend(overrideText) {
      var text = overrideText || this.$msgInput.value.trim();
      if (!text || this.isLoading) return;

      this.addMessage(text, 'user');
      if (!overrideText) {
        this.$msgInput.value = '';
        this.$msgInput.style.height = 'auto';
        this.$sendBtn.disabled = true;
      }
      this.$suggestedActions.classList.add('hidden');
      this.sendMessage(text);
    }

    async sendMessage(text) {
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
            page_url: window.location.href
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
