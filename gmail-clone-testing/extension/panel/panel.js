/**
 * Panel Script - Gmail API QA Tool
 * Handles panel initialization, endpoint selection, and API execution
 */

import { getApiClient } from './api-client.js';
import { endpoints } from './endpoints.js';
import { generateParamsForm, setupExampleChipListeners, cacheResponseData } from './ui-components.js';

class GmailQAPanelUI {
  constructor() {
    this.siteMode = null;
    this.sessionId = null;
    this.apiClient = null;
    this.currentEndpoint = null;
  }

  /**
   * Initialize panel with site information
   * @param {string} site - 'real' or 'clone'
   * @param {string | null} sessionId - Session ID for clone mode
   */
  initializePanel(site, sessionId) {
    this.siteMode = site;
    this.sessionId = sessionId;
    this.apiClient = getApiClient(site, sessionId);

    console.log('[Panel] Initializing with:', { site, sessionId });

    this.updateModeIndicator();
    this.updateModeDisplay();
    this.notifyReady();
  }

  /**
   * Setup endpoint selection dropdowns
   */
  setupEndpointSelection() {
    const resourceFilter = document.getElementById('resource-filter');
    const endpointSelect = document.getElementById('endpoint-select');

    // Resource filter change
    resourceFilter.addEventListener('change', () => {
      this.filterEndpoints(resourceFilter.value);
    });

    // Endpoint select change
    endpointSelect.addEventListener('change', () => {
      const endpointId = endpointSelect.value;
      if (endpointId) {
        this.handleEndpointChange(endpointId);
      } else {
        this.resetUI();
      }
    });

    console.log('[Panel] Endpoint selection setup complete');
  }

  /**
   * Filter endpoints by resource type
   * @param {string} resourceType - Resource type to filter by
   */
  filterEndpoints(resourceType) {
    const endpointSelect = document.getElementById('endpoint-select');
    endpointSelect.innerHTML = '<option value="">Select an endpoint...</option>';

    Object.values(endpoints).forEach(endpoint => {
      if (resourceType === 'all' || endpoint.resource === resourceType) {
        const option = document.createElement('option');
        option.value = endpoint.id;
        option.textContent = endpoint.name;
        endpointSelect.appendChild(option);
      }
    });

    this.resetUI();
  }

  /**
   * Handle endpoint selection change
   * @param {string} endpointId - Selected endpoint ID
   */
  handleEndpointChange(endpointId) {
    this.currentEndpoint = endpoints[endpointId];

    if (!this.currentEndpoint) {
      console.error('[Panel] Endpoint not found:', endpointId);
      return;
    }

    console.log('[Panel] Endpoint selected:', this.currentEndpoint.name);

    // Update UI
    this.updateEndpointBar(this.currentEndpoint);
    this.displayDocumentation(this.currentEndpoint);
    this.generateAndDisplayParamsForm();
    this.showExecuteButton();
    this.resetResultSections();
  }

  /**
   * Update endpoint bar display
   * @param {Object} endpoint - Endpoint configuration
   */
  updateEndpointBar(endpoint) {
    const bar = document.getElementById('endpoint-bar');
    const methodSpan = document.getElementById('endpoint-method');
    const nameSpan = document.getElementById('endpoint-name');
    const pathSpan = document.getElementById('endpoint-path');

    if (endpoint) {
      methodSpan.textContent = endpoint.method;
      methodSpan.className = `endpoint-method ${endpoint.method.toLowerCase()}`;
      nameSpan.textContent = endpoint.name;
      pathSpan.textContent = endpoint.path;
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  /**
   * Display endpoint documentation
   * @param {Object} endpoint - Endpoint configuration
   */
  displayDocumentation(endpoint) {
    const section = document.getElementById('docs-section');

    let html = `
      <div class="docs-enhanced">
        <div class="docs-header">
          <span class="method-badge ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
          <strong>${endpoint.name}</strong>
        </div>
        <div class="docs-description">${endpoint.docs}</div>
    `;

    if (endpoint.paramsConfig && endpoint.paramsConfig.length > 0) {
      const required = endpoint.paramsConfig.filter(p => p.required);
      const optional = endpoint.paramsConfig.filter(p => !p.required);

      html += `
        <div class="docs-params-overview">
          <strong>What you'll need:</strong>
          <ul>
      `;

      required.forEach(p => {
        html += `<li>✓ ${p.label} <span class="required-badge">required</span></li>`;
      });

      if (optional.length > 0) {
        html += `<li class="optional-info">+ ${optional.length} optional parameter${optional.length > 1 ? 's' : ''}</li>`;
      }

      html += `</ul></div>`;
    }

    html += `</div>`;
    section.innerHTML = html;
  }

  /**
   * Generate and display parameters form
   */
  generateAndDisplayParamsForm() {
    const section = document.getElementById('params-section');
    const formHtml = generateParamsForm(this.currentEndpoint);
    section.innerHTML = formHtml;

    // Setup event listeners for example chips
    setupExampleChipListeners(section);
  }

  /**
   * Show execute button
   */
  showExecuteButton() {
    const btn = document.getElementById('execute-btn');
    btn.style.display = 'block';
  }

  /**
   * Setup execute button handler
   */
  setupExecuteButton() {
    const btn = document.getElementById('execute-btn');
    btn.addEventListener('click', () => {
      this.executeApiCall();
    });
    console.log('[Panel] Execute button setup complete');
  }

  /**
   * Execute API call
   */
  async executeApiCall() {
    if (!this.currentEndpoint) {
      console.error('[Panel] No endpoint selected');
      return;
    }

    console.log('[Panel] Executing:', this.currentEndpoint.name);

    try {
      // Collect parameters
      const params = this.collectFormParams();

      // Validate required parameters
      const validation = this.validateParams(params);
      if (!validation.isValid) {
        this.displayError(`Missing required parameters: ${validation.missing.join(', ')}`);
        return;
      }

      // Separate path params from body params
      const pathParams = {};
      const bodyParams = {};

      if (this.currentEndpoint.paramsConfig) {
        this.currentEndpoint.paramsConfig.forEach(paramConfig => {
          const value = params[paramConfig.name];
          if (value !== undefined && value !== null && value !== '') {
            // Check if this param is in the path
            if (this.currentEndpoint.path.includes(`{${paramConfig.name}}`)) {
              pathParams[paramConfig.name] = value;
            } else {
              bodyParams[paramConfig.name] = value;
            }
          }
        });
      }

      // For POST/PATCH/PUT, move all non-path params to body
      const body = (this.currentEndpoint.method === 'POST' ||
                    this.currentEndpoint.method === 'PATCH' ||
                    this.currentEndpoint.method === 'PUT') ? bodyParams : null;

      // For GET, all non-path params go in query string
      const queryParams = this.currentEndpoint.method === 'GET' ? bodyParams : {};

      // Build full URL for display
      const fullParams = { ...pathParams, ...queryParams };
      const displayUrl = this.apiClient.buildUrl(this.currentEndpoint.path, fullParams);

      // Display request
      this.displayRequest(this.currentEndpoint, displayUrl, body);

      // Execute request
      const startTime = Date.now();
      const result = await this.apiClient.executeRequest(
        this.currentEndpoint.path,
        this.currentEndpoint.method,
        fullParams,
        body
      );
      const responseTime = Date.now() - startTime;

      // Display response
      if (result.error) {
        this.displayError(result.error);
      } else {
        this.displayResponse(result.status, responseTime, result.body);

        // Cache successful List responses
        if (result.status >= 200 && result.status < 300 && result.body) {
          cacheResponseData(result.body);
        }
      }

    } catch (error) {
      console.error('[Panel] Execution error:', error);
      this.displayError(error.message);
    }
  }

  /**
   * Collect form parameters
   * @returns {Object} Parameters object
   */
  collectFormParams() {
    const params = {};

    if (!this.currentEndpoint.paramsConfig) {
      return params;
    }

    this.currentEndpoint.paramsConfig.forEach(paramConfig => {
      const input = document.getElementById(`param-${paramConfig.name}`);
      if (input && input.value) {
        params[paramConfig.name] = input.value;
      }
    });

    return params;
  }

  /**
   * Validate required parameters
   * @param {Object} params - Parameters object
   * @returns {Object} Validation result {isValid, missing}
   */
  validateParams(params) {
    const missing = [];

    if (this.currentEndpoint.paramsConfig) {
      this.currentEndpoint.paramsConfig.forEach(paramConfig => {
        if (paramConfig.required && !params[paramConfig.name]) {
          missing.push(paramConfig.label);
        }
      });
    }

    return {
      isValid: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Display request details
   * @param {Object} endpoint - Endpoint configuration
   * @param {string} url - Request URL
   * @param {Object|null} body - Request body
   */
  displayRequest(endpoint, url, body) {
    const section = document.getElementById('request-section');

    let html = `
      <div class="section-header">
        <h4>📤 Request</h4>
      </div>
      <div class="detail-row">
        <span class="label">Method:</span>
        <span class="value method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
      </div>
      <div class="detail-row">
        <span class="label">URL:</span>
      </div>
      <div class="code-block">${url}</div>
    `;

    if (body && Object.keys(body).length > 0) {
      html += `
        <div class="detail-row" style="margin-top: 10px;">
          <span class="label">Body:</span>
        </div>
        <div class="code-block">${JSON.stringify(body, null, 2)}</div>
      `;
    }

    section.innerHTML = html;
    section.style.display = 'block';
  }

  /**
   * Display response details
   * @param {number} status - HTTP status code
   * @param {number} responseTime - Response time in ms
   * @param {*} data - Response data
   */
  displayResponse(status, responseTime, data) {
    const section = document.getElementById('response-section');

    const statusClass = status >= 200 && status < 300 ? 'status-success' :
                        status >= 400 && status < 500 ? 'status-warning' : 'status-error';

    let html = `
      <div class="section-header">
        <h4>📥 Response</h4>
      </div>
      <div class="detail-row">
        <span class="label">Status:</span>
        <span class="value ${statusClass}">${status}</span>
      </div>
      <div class="detail-row">
        <span class="label">Time:</span>
        <span class="value">${responseTime}ms</span>
      </div>
      <div class="detail-row">
        <span class="label">Body:</span>
      </div>
      <div class="code-block">${JSON.stringify(data, null, 2)}</div>
    `;

    section.innerHTML = html;
    section.style.display = 'block';
  }

  /**
   * Display error message
   * @param {string} message - Error message
   */
  displayError(message) {
    const section = document.getElementById('response-section');

    const html = `
      <div class="section-header error">
        <h4>❌ Error</h4>
      </div>
      <div class="code-block" style="color: #d93025;">${message}</div>
    `;

    section.innerHTML = html;
    section.style.display = 'block';
  }

  /**
   * Reset result sections
   */
  resetResultSections() {
    document.getElementById('request-section').style.display = 'none';
    document.getElementById('response-section').style.display = 'none';
  }

  /**
   * Reset entire UI
   */
  resetUI() {
    this.currentEndpoint = null;
    this.updateEndpointBar(null);
    document.getElementById('docs-section').innerHTML = '';
    document.getElementById('params-section').innerHTML = '';
    document.getElementById('execute-btn').style.display = 'none';
    this.resetResultSections();
  }

  /**
   * Update the mode indicator badge in header
   */
  updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (!indicator) return;

    if (this.siteMode === 'real') {
      indicator.textContent = 'Real Gmail';
      indicator.className = 'mode-badge real';
    } else {
      indicator.textContent = 'Clone';
      indicator.className = 'mode-badge clone';
    }
  }

  /**
   * Update the mode display text in placeholder
   */
  updateModeDisplay() {
    const display = document.getElementById('mode-display');
    if (!display) return;

    if (this.siteMode === 'real') {
      display.textContent = 'Real Gmail (OAuth Authentication)';
      display.style.color = '#137333';
    } else {
      const sessionPreview = this.sessionId
        ? `${this.sessionId.substring(0, 12)}...`
        : 'Not found';
      display.textContent = `Clone (Session: ${sessionPreview})`;
      display.style.color = '#1967d2';
    }
  }

  /**
   * Notify parent that panel is ready
   */
  notifyReady() {
    window.parent.postMessage({ type: 'PANEL_READY' }, '*');
    console.log('[Panel] Sent PANEL_READY message');
  }

  /**
   * Handle close button click
   */
  handleClose() {
    console.log('[Panel] Close button clicked');
    window.parent.postMessage({ type: 'CLOSE_PANEL' }, '*');
  }

  /**
   * Setup message listener for initialization
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Only accept messages from parent
      if (event.source !== window.parent) return;

      const { type, site, sessionId } = event.data;

      if (type === 'INIT') {
        this.initializePanel(site, sessionId);
      }
    });

    console.log('[Panel] Message listener setup complete');
  }

  /**
   * Setup close button handler
   */
  setupCloseButton() {
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleClose());
      console.log('[Panel] Close button handler setup complete');
    }
  }

  /**
   * Initialize the panel UI
   */
  init() {
    console.log('[Panel] Initializing panel UI...');

    this.setupMessageListener();
    this.setupCloseButton();
    this.setupEndpointSelection();
    this.setupExecuteButton();

    console.log('[Panel] Ready and waiting for INIT message');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const panelUI = new GmailQAPanelUI();
    panelUI.init();
  });
} else {
  const panelUI = new GmailQAPanelUI();
  panelUI.init();
}
