/**
 * Content Script - Gmail API QA Tool
 * Injects floating panel on Gmail sites (real and clone)
 */

class GmailQAPanel {
  constructor() {
    this.iframe = null;
    this.site = this.detectSite();
    this.sessionId = this.extractSessionId();
  }

  /**
   * Detect which Gmail site we're on
   * @returns {'real' | 'clone'} Site type
   */
  detectSite() {
    const hostname = window.location.hostname;
    if (hostname === 'mail.google.com') return 'real';
    if (hostname === 'gmail.matrices.ai') return 'clone';

    console.warn('[Gmail QA] Unknown hostname:', hostname);
    return 'clone'; // Default to clone mode
  }

  /**
   * Extract sessionId cookie for clone authentication
   * @returns {string | null} Session ID or null
   */
  extractSessionId() {
    if (this.site !== 'clone') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionId') {
        return value;
      }
    }

    console.warn('[Gmail QA] No sessionId cookie found');
    return null;
  }

  /**
   * Create panel iframe element
   * @returns {HTMLIFrameElement} Configured iframe
   */
  createPanelIframe() {
    const iframe = document.createElement('iframe');
    iframe.id = 'gmail-qa-panel';
    iframe.src = chrome.runtime.getURL('panel/panel.html');
    iframe.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 480px;
      height: 90vh;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      background: white;
    `;
    return iframe;
  }

  /**
   * Send initialization message to panel
   */
  sendInitMessage() {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.error('[Gmail QA] Iframe not ready');
      return;
    }

    const message = {
      type: 'INIT',
      site: this.site,
      sessionId: this.sessionId
    };

    console.log('[Gmail QA] Sending init message:', message);
    this.iframe.contentWindow.postMessage(message, '*');
  }

  /**
   * Handle messages from panel
   * @param {MessageEvent} event
   */
  handlePanelMessage(event) {
    // Verify message is from our iframe
    if (event.source !== this.iframe?.contentWindow) return;

    const { type } = event.data;

    switch (type) {
      case 'PANEL_READY':
        console.log('[Gmail QA] Panel initialized successfully');
        break;

      case 'CLOSE_PANEL':
        console.log('[Gmail QA] Closing panel');
        if (this.iframe) {
          this.iframe.style.display = 'none';
        }
        break;

      default:
        console.log('[Gmail QA] Unknown message type:', type);
    }
  }

  /**
   * Inject panel into page
   */
  injectPanel() {
    // Check if already injected
    if (document.getElementById('gmail-qa-panel')) {
      console.log('[Gmail QA] Panel already injected');
      return;
    }

    console.log(`[Gmail QA] Injecting panel on ${this.site} Gmail`);

    // Create and inject iframe
    this.iframe = this.createPanelIframe();
    document.body.appendChild(this.iframe);

    // Wait for iframe to load, then send init message
    this.iframe.addEventListener('load', () => {
      console.log('[Gmail QA] Iframe loaded, sending init message');
      // Small delay to ensure panel.js is ready
      setTimeout(() => this.sendInitMessage(), 100);
    });

    // Listen for messages from panel
    window.addEventListener('message', (event) => this.handlePanelMessage(event));
  }

  /**
   * Initialize the extension
   */
  init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.injectPanel());
    } else {
      this.injectPanel();
    }
  }
}

// Initialize when script loads
const panel = new GmailQAPanel();
panel.init();
