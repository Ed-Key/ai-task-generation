/**
 * Gmail API QA Tool - Autocomplete Version
 * Browser console script for testing Gmail API clone endpoints
 * Features: Smart autocomplete for IDs, cached list responses, elegant dark UI
 * Usage: Paste this entire script into the browser console (F12) on gmail.matrices.ai
 */

(function() {
  'use strict';

  // Remove existing panel if present
  const existing = document.getElementById('api-qa-tool');
  if (existing) existing.remove();

  // ===== RESPONSE CACHE =====
  const responseCache = {
    labels: [],
    threads: [],
    messages: [],
    drafts: [],
    lastUpdated: null
  };

  // ===== PARAMETER METADATA =====
  const parameterMetadata = {
    'name': {
      type: 'string',
      label: 'Label Name',
      placeholder: 'e.g., Work, Personal, Important',
      helpText: 'Give your label a descriptive name that you\'ll recognize in Gmail',
      required: true
    },

    'labelListVisibility': {
      type: 'enum',
      label: 'Sidebar Visibility',
      helpText: 'Control when this label appears in your Gmail sidebar',
      options: [
        { value: 'labelShow', label: 'Always Show', description: 'Label always appears in sidebar' },
        { value: 'labelShowIfUnread', label: 'Show If Unread', description: 'Label appears only when it has unread messages' },
        { value: 'labelHide', label: 'Hide', description: 'Label never appears in sidebar (accessible via search)' }
      ],
      defaultValue: 'labelShow',
      required: false
    },

    'messageListVisibility': {
      type: 'enum',
      label: 'Message List Visibility',
      helpText: 'Control whether messages with this label appear in your message list',
      options: [
        { value: 'show', label: 'Show in List', description: 'Messages appear in message list' },
        { value: 'hide', label: 'Hide from List', description: 'Messages are hidden from message list' }
      ],
      defaultValue: 'show',
      required: false
    },

    'q': {
      type: 'search',
      label: 'Search Query',
      placeholder: 'e.g., is:unread from:boss@company.com',
      helpText: 'Use Gmail search syntax to filter results',
      examples: [
        { query: 'is:unread', description: 'Unread messages' },
        { query: 'is:starred', description: 'Starred messages' },
        { query: 'from:user@example.com', description: 'From specific sender' },
        { query: 'subject:urgent', description: 'Subject contains "urgent"' },
        { query: 'has:attachment', description: 'Has attachments' },
        { query: 'after:2024/01/01', description: 'Sent after January 1, 2024' }
      ],
      required: false
    },

    'id': {
      type: 'id',
      label: 'ID',
      placeholder: 'e.g., Label_123 or 18c5f8a9b2d3e4f5',
      helpText: 'Use a "List" endpoint first to find the ID you need',
      required: true
    },

    'labelIds': {
      type: 'array',
      label: 'Label IDs',
      placeholder: 'e.g., INBOX,UNREAD,Label_123',
      helpText: 'Enter label IDs separated by commas (no spaces)',
      examples: [
        { value: 'INBOX', description: 'Inbox label' },
        { value: 'UNREAD', description: 'Unread label' },
        { value: 'STARRED', description: 'Starred label' },
        { value: 'TRASH', description: 'Trash label' },
        { value: 'SPAM', description: 'Spam label' }
      ],
      required: false
    },

    'addLabelIds': {
      type: 'array',
      label: 'Labels to Add',
      placeholder: 'e.g., STARRED,Label_Important',
      helpText: 'Label IDs to add to this item (comma-separated)',
      examples: [
        { value: 'STARRED', description: 'Star this item' },
        { value: 'IMPORTANT', description: 'Mark as important' },
        { value: 'UNREAD', description: 'Mark as unread' }
      ],
      required: false
    },

    'removeLabelIds': {
      type: 'array',
      label: 'Labels to Remove',
      placeholder: 'e.g., UNREAD,INBOX',
      helpText: 'Label IDs to remove from this item (comma-separated)',
      examples: [
        { value: 'UNREAD', description: 'Mark as read' },
        { value: 'INBOX', description: 'Archive (remove from inbox)' },
        { value: 'STARRED', description: 'Unstar' }
      ],
      required: false
    },

    'maxResults': {
      type: 'number',
      label: 'Maximum Results',
      placeholder: 'e.g., 10',
      helpText: 'Number of results to return (1-500, default is 100)',
      min: 1,
      max: 500,
      defaultValue: 100,
      required: false
    },

    'to': {
      type: 'email',
      label: 'Recipient',
      placeholder: 'e.g., recipient@example.com',
      helpText: 'Email address of the person you\'re sending to',
      required: true
    },

    'subject': {
      type: 'string',
      label: 'Subject',
      placeholder: 'e.g., Meeting tomorrow at 3pm',
      helpText: 'Subject line of the email',
      required: true
    },

    'body': {
      type: 'textarea',
      label: 'Message Body',
      placeholder: 'Write your email message here...',
      helpText: 'The content of your email',
      rows: 5,
      required: true
    }
  };

  // ===== ENDPOINTS CONFIGURATION =====
  const endpoints = {
    // LABELS
    'list-labels': {
      id: 'list-labels',
      name: 'List Labels',
      resource: 'labels',
      method: 'GET',
      path: '/gmail/v1/users/me/labels',
      paramsConfig: [],
      docs: 'Lists all labels in your mailbox. Use this to find label IDs for other operations.'
    },

    'get-label': {
      id: 'get-label',
      name: 'Get Label',
      resource: 'labels',
      method: 'GET',
      path: '/gmail/v1/users/me/labels/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Gets the details of a specific label, including its name and visibility settings.'
    },

    'create-label': {
      id: 'create-label',
      name: 'Create Label',
      resource: 'labels',
      method: 'POST',
      path: '/gmail/v1/users/me/labels',
      paramsConfig: [
        { ...parameterMetadata.name, name: 'name' },
        { ...parameterMetadata.labelListVisibility, name: 'labelListVisibility' },
        { ...parameterMetadata.messageListVisibility, name: 'messageListVisibility' }
      ],
      docs: 'Creates a new label with the specified name and visibility settings.'
    },

    'update-label': {
      id: 'update-label',
      name: 'Update Label',
      resource: 'labels',
      method: 'PATCH',
      path: '/gmail/v1/users/me/labels/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' },
        { ...parameterMetadata.name, name: 'name', required: false, helpText: 'New name for the label (leave empty to keep current name)' }
      ],
      docs: 'Updates the name or properties of an existing label.'
    },

    'delete-label': {
      id: 'delete-label',
      name: 'Delete Label',
      resource: 'labels',
      method: 'DELETE',
      path: '/gmail/v1/users/me/labels/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Permanently deletes the specified label. This cannot be undone.'
    },

    // THREADS
    'list-threads': {
      id: 'list-threads',
      name: 'List Threads',
      resource: 'threads',
      method: 'GET',
      path: '/gmail/v1/users/me/threads',
      paramsConfig: [
        { ...parameterMetadata.q, name: 'q' },
        { ...parameterMetadata.labelIds, name: 'labelIds' },
        { ...parameterMetadata.maxResults, name: 'maxResults' }
      ],
      docs: 'Lists conversation threads in your mailbox.'
    },

    'get-thread': {
      id: 'get-thread',
      name: 'Get Thread',
      resource: 'threads',
      method: 'GET',
      path: '/gmail/v1/users/me/threads/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Gets the specified thread with all its messages and details.'
    },

    'modify-thread': {
      id: 'modify-thread',
      name: 'Modify Thread',
      resource: 'threads',
      method: 'POST',
      path: '/gmail/v1/users/me/threads/{id}/modify',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' },
        { ...parameterMetadata.addLabelIds, name: 'addLabelIds' },
        { ...parameterMetadata.removeLabelIds, name: 'removeLabelIds' }
      ],
      docs: 'Modifies the labels on the specified thread.'
    },

    'trash-thread': {
      id: 'trash-thread',
      name: 'Trash Thread',
      resource: 'threads',
      method: 'POST',
      path: '/gmail/v1/users/me/threads/{id}/trash',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Moves the specified thread to trash.'
    },

    'delete-thread': {
      id: 'delete-thread',
      name: 'Delete Thread',
      resource: 'threads',
      method: 'DELETE',
      path: '/gmail/v1/users/me/threads/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Permanently deletes the specified thread and all its messages.'
    },

    // MESSAGES
    'list-messages': {
      id: 'list-messages',
      name: 'List Messages',
      resource: 'messages',
      method: 'GET',
      path: '/gmail/v1/users/me/messages',
      paramsConfig: [
        { ...parameterMetadata.q, name: 'q' },
        { ...parameterMetadata.labelIds, name: 'labelIds' },
        { ...parameterMetadata.maxResults, name: 'maxResults' }
      ],
      docs: 'Lists individual messages in your mailbox.'
    },

    'get-message': {
      id: 'get-message',
      name: 'Get Message',
      resource: 'messages',
      method: 'GET',
      path: '/gmail/v1/users/me/messages/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Gets the specified message with full details.'
    },

    'modify-message': {
      id: 'modify-message',
      name: 'Modify Message',
      resource: 'messages',
      method: 'POST',
      path: '/gmail/v1/users/me/messages/{id}/modify',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' },
        { ...parameterMetadata.addLabelIds, name: 'addLabelIds' },
        { ...parameterMetadata.removeLabelIds, name: 'removeLabelIds' }
      ],
      docs: 'Modifies the labels on the specified message.'
    },

    'trash-message': {
      id: 'trash-message',
      name: 'Trash Message',
      resource: 'messages',
      method: 'POST',
      path: '/gmail/v1/users/me/messages/{id}/trash',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Moves the specified message to trash.'
    },

    'delete-message': {
      id: 'delete-message',
      name: 'Delete Message',
      resource: 'messages',
      method: 'DELETE',
      path: '/gmail/v1/users/me/messages/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Permanently deletes the specified message.'
    },

    // DRAFTS
    'list-drafts': {
      id: 'list-drafts',
      name: 'List Drafts',
      resource: 'drafts',
      method: 'GET',
      path: '/gmail/v1/users/me/drafts',
      paramsConfig: [
        { ...parameterMetadata.maxResults, name: 'maxResults' }
      ],
      docs: 'Lists all draft messages in your mailbox.'
    },

    'get-draft': {
      id: 'get-draft',
      name: 'Get Draft',
      resource: 'drafts',
      method: 'GET',
      path: '/gmail/v1/users/me/drafts/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Gets the specified draft including the message content.'
    },

    'create-draft': {
      id: 'create-draft',
      name: 'Create Draft',
      resource: 'drafts',
      method: 'POST',
      path: '/gmail/v1/users/me/drafts',
      paramsConfig: [
        { ...parameterMetadata.to, name: 'to' },
        { ...parameterMetadata.subject, name: 'subject' },
        { ...parameterMetadata.body, name: 'body' }
      ],
      docs: 'Creates a new draft email with the specified content.'
    },

    'update-draft': {
      id: 'update-draft',
      name: 'Update Draft',
      resource: 'drafts',
      method: 'PUT',
      path: '/gmail/v1/users/me/drafts/{id}',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' },
        { ...parameterMetadata.to, name: 'to' },
        { ...parameterMetadata.subject, name: 'subject' },
        { ...parameterMetadata.body, name: 'body' }
      ],
      docs: 'Updates an existing draft with new content.'
    },

    'send-draft': {
      id: 'send-draft',
      name: 'Send Draft',
      resource: 'drafts',
      method: 'POST',
      path: '/gmail/v1/users/me/drafts/send',
      paramsConfig: [
        { ...parameterMetadata.id, name: 'id' }
      ],
      docs: 'Sends the specified draft to its recipients.'
    }
  };

  // ===== CACHE FUNCTIONS =====

  function cacheResponseData(data) {
    if (data.labels) {
      responseCache.labels = data.labels;
      responseCache.lastUpdated = Date.now();
    }
    if (data.threads) {
      responseCache.threads = data.threads;
      responseCache.lastUpdated = Date.now();
    }
    if (data.messages) {
      responseCache.messages = data.messages;
      responseCache.lastUpdated = Date.now();
    }
    if (data.drafts) {
      responseCache.drafts = data.drafts;
      responseCache.lastUpdated = Date.now();
    }
  }

  function getCachedSuggestions(resourceType) {
    const cached = responseCache[resourceType] || [];
    return cached.map(item => ({
      id: item.id,
      name: item.name || item.snippet || (item.id.substring(0, 30) + '...'),
      rawItem: item
    }));
  }

  // ===== HELPER FUNCTIONS =====

  function getSessionId() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionId') return value;
    }
    return null;
  }

  function getStatusText(status) {
    const statusTexts = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return statusTexts[status] || 'Unknown';
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getCurrentEndpoint() {
    const endpointId = document.getElementById('endpoint-select').value;
    return endpoints[endpointId];
  }

  function filterEndpoints(resourceType) {
    const select = document.getElementById('endpoint-select');
    select.innerHTML = '<option value="">Select an endpoint...</option>';

    Object.keys(endpoints).forEach(id => {
      const endpoint = endpoints[id];
      if (resourceType === 'all' || endpoint.resource === resourceType) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = endpoint.name;
        select.appendChild(option);
      }
    });

    updateEndpointBar(null);
    document.getElementById('params-section').innerHTML = '';
    document.getElementById('docs-section').innerHTML = '';
    resetSections();
  }

  function displayDocumentation(endpoint) {
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

  function renderParam(param) {
    if (param.type === 'id') {
      return renderIdFieldWithAutocomplete(param);
    }

    const isRequired = param.required;
    const requiredBadge = isRequired
      ? '<span class="badge required">Required</span>'
      : '<span class="badge optional">Optional</span>';

    let defaultBadge = '';
    if (param.defaultValue && !isRequired) {
      const defaultLabel = param.type === 'enum'
        ? param.options.find(o => o.value === param.defaultValue)?.label || param.defaultValue
        : param.defaultValue;
      defaultBadge = `<span class="badge default">Default: ${defaultLabel}</span>`;
    }

    let inputHtml = '';

    switch (param.type) {
      case 'enum':
        inputHtml = `
          <select id="param-${param.name}" class="param-input">
            <option value="">Choose ${param.label.toLowerCase()}...</option>
            ${param.options.map(opt => `
              <option value="${opt.value}" ${param.defaultValue === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
          <div class="param-options">
            ${param.options.map(opt => `
              <div class="option-item">
                <strong>${opt.label}:</strong> ${opt.description}
              </div>
            `).join('')}
          </div>
        `;
        break;

      case 'search':
        inputHtml = `
          <input type="text" id="param-${param.name}" class="param-input" placeholder="${param.placeholder}">
          ${param.examples ? `
            <div class="param-examples">
              <strong>📌 Common Examples:</strong>
              <div class="example-chips">
                ${param.examples.map(ex => `
                  <button class="example-chip"
                          onclick="document.getElementById('param-${param.name}').value = '${ex.query}'"
                          title="${ex.description}">
                    ${ex.query}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
        break;

      case 'array':
        inputHtml = `
          <input type="text" id="param-${param.name}" class="param-input" placeholder="${param.placeholder}">
          ${param.examples ? `
            <div class="param-examples">
              <strong>💡 Common Label IDs:</strong>
              <div class="example-chips">
                ${param.examples.map(ex => `
                  <button class="example-chip"
                          onclick="document.getElementById('param-${param.name}').value += (document.getElementById('param-${param.name}').value ? ',' : '') + '${ex.value}'"
                          title="${ex.description}">
                    ${ex.value}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
        break;

      case 'textarea':
        inputHtml = `
          <textarea id="param-${param.name}" class="param-input" rows="${param.rows || 4}" placeholder="${param.placeholder}"></textarea>
        `;
        break;

      case 'number':
        inputHtml = `
          <input type="number" id="param-${param.name}" class="param-input" placeholder="${param.placeholder}"
                 ${param.min ? `min="${param.min}"` : ''}
                 ${param.max ? `max="${param.max}"` : ''}
                 ${param.defaultValue ? `value="${param.defaultValue}"` : ''}>
        `;
        break;

      default:
        inputHtml = `
          <input type="text" id="param-${param.name}" class="param-input" placeholder="${param.placeholder}">
        `;
    }

    return `
      <div class="form-group">
        <label for="param-${param.name}">
          ${param.label}
          ${requiredBadge}
          ${defaultBadge}
        </label>
        ${inputHtml}
        ${param.helpText ? `<div class="param-help">ℹ️ ${param.helpText}</div>` : ''}
      </div>
    `;
  }

  function renderIdFieldWithAutocomplete(param) {
    const endpoint = getCurrentEndpoint();
    const resourceType = endpoint.resource;
    const suggestions = getCachedSuggestions(resourceType);
    const hasCache = suggestions.length > 0;

    const requiredBadge = param.required
      ? '<span class="badge required">Required</span>'
      : '<span class="badge optional">Optional</span>';

    return `
      <div class="form-group">
        <label for="param-${param.name}">
          ${param.label}
          ${requiredBadge}
        </label>

        <input type="text"
               id="param-${param.name}"
               class="param-input"
               list="suggestions-${param.name}"
               placeholder="${param.placeholder}"
               oninput="window.handleAutocompleteFilter(this.value, '${resourceType}', 'param-${param.name}')">

        ${hasCache ? `
          <datalist id="suggestions-${param.name}">
            ${suggestions.map(s => `
              <option value="${s.id}">
                ${s.name} (${s.id})
              </option>
            `).join('')}
          </datalist>

          <div class="param-examples autocomplete-suggestions">
            <strong>💡 Available ${resourceType}:</strong>
            <div class="example-chips" id="chips-${param.name}">
              ${suggestions.map(s => `
                <button class="example-chip"
                        data-id="${s.id}"
                        data-name="${s.name}"
                        onclick="document.getElementById('param-${param.name}').value = '${s.id}'"
                        title="${s.id}">
                  ${s.name}
                </button>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="param-help">
            ℹ️ ${param.helpText}
          </div>
          <div class="no-cache-hint">
            <p>💡 Run "List ${capitalize(resourceType)}" first to see available options</p>
            <button class="helper-btn" onclick="window.quickRunList('${resourceType}')">
              📋 Run "List ${capitalize(resourceType)}"
            </button>
          </div>
        `}
      </div>
    `;
  }

  function generateParamsForm(endpoint) {
    const section = document.getElementById('params-section');

    if (!endpoint.paramsConfig || endpoint.paramsConfig.length === 0) {
      section.innerHTML = '';
      return;
    }

    let html = '<div class="params-form">';
    endpoint.paramsConfig.forEach(param => {
      html += renderParam(param);
    });
    html += '</div>';
    section.innerHTML = html;
  }

  function buildRequestUrl(endpoint, params) {
    let path = endpoint.path;
    const queryParams = [];

    const paramNames = endpoint.paramsConfig
      ? endpoint.paramsConfig.map(p => p.name)
      : [];

    paramNames.forEach(param => {
      if (path.includes(`{${param}}`)) {
        const value = params[param] || '';
        path = path.replace(`{${param}}`, value);
      } else if (params[param]) {
        queryParams.push(`${param}=${encodeURIComponent(params[param])}`);
      }
    });

    let url = 'https://gmail.matrices.ai' + path;
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    return url;
  }

  function buildRequestBody(endpoint, params) {
    const body = {};

    const paramNames = endpoint.paramsConfig
      ? endpoint.paramsConfig.map(p => p.name)
      : [];

    paramNames.forEach(param => {
      if (!endpoint.path.includes(`{${param}}`) && params[param]) {
        if (param.toLowerCase().includes('labelids')) {
          body[param] = params[param].split(',').map(id => id.trim());
        } else {
          body[param] = params[param];
        }
      }
    });

    if (endpoint.id.includes('draft') && params.to && params.subject && params.body) {
      const message = `To: ${params.to}\r\nSubject: ${params.subject}\r\n\r\n${params.body}`;
      body.message = {
        raw: btoa(unescape(encodeURIComponent(message)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')  // Remove padding (Gmail API requirement)
      };
      delete body.to;
      delete body.subject;
      delete body.body;
    }

    return body;
  }

  function displayRequest(endpoint, url, body) {
    const section = document.getElementById('request-section');

    let html = `
      <div class="section-header">
        <h4>📤 Request</h4>
      </div>
      <div class="request-details">
        <div class="detail-row">
          <span class="label">Method:</span>
          <span class="value method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
        </div>
        <div class="detail-row">
          <span class="label">URL:</span>
          <div class="code-block">${url}</div>
        </div>
    `;

    if (body && Object.keys(body).length > 0) {
      html += `
        <div class="detail-row">
          <span class="label">Body:</span>
          <div class="code-block">${JSON.stringify(body, null, 2)}</div>
        </div>
      `;
    }

    html += '</div>';
    section.innerHTML = html;
    section.style.display = 'block';
  }

  function displayResponse(status, time, data) {
    // Cache first
    cacheResponseData(data);

    // Refresh autocomplete fields if they exist
    const endpoint = getCurrentEndpoint();
    if (endpoint) {
      generateParamsForm(endpoint);
    }

    const section = document.getElementById('response-section');

    const statusClass = status >= 200 && status < 300 ? 'success' :
                        status >= 400 && status < 500 ? 'warning' : 'error';

    let html = `
      <div class="section-header">
        <h4>📥 Response</h4>
      </div>
      <div class="response-details">
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value status-${statusClass}">${status} ${getStatusText(status)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span class="value">${time}ms</span>
        </div>
        <div class="detail-row">
          <span class="label">Response Body:</span>
          <div class="code-block">${JSON.stringify(data, null, 2)}</div>
        </div>
      </div>
    `;

    section.innerHTML = html;
    section.style.display = 'block';

    showVerificationSection();
  }

  function displayError(message) {
    const section = document.getElementById('response-section');
    section.innerHTML = `
      <div class="section-header error">
        <h4>❌ Error</h4>
      </div>
      <div class="error-details">
        <div class="code-block">${message}</div>
      </div>
    `;
    section.style.display = 'block';
  }

  function showVerificationSection() {
    const section = document.getElementById('verification-section');
    section.innerHTML = `
      <div class="verification-header">
        <h4>✓ Verification</h4>
        <p>Does the Gmail UI behavior match the API documentation?</p>
      </div>
      <div class="verification-options">
        <label class="radio-option">
          <input type="radio" name="verification" value="yes" onchange="window.handleVerification('yes')">
          <span>✅ Yes - Behavior matches</span>
        </label>
        <label class="radio-option">
          <input type="radio" name="verification" value="no" onchange="window.handleVerification('no')">
          <span>❌ No - Found an issue</span>
        </label>
      </div>
      <div id="issue-details" style="display: none;"></div>
    `;
    section.style.display = 'block';
  }

  function updateEndpointBar(endpoint) {
    const bar = document.getElementById('endpoint-bar');
    const methodEl = document.getElementById('endpoint-method');
    const nameEl = document.getElementById('endpoint-name');
    const pathEl = document.getElementById('endpoint-path');

    if (endpoint) {
      bar.classList.add('active');
      methodEl.textContent = endpoint.method;
      methodEl.className = `endpoint-method ${endpoint.method.toLowerCase()}`;
      nameEl.textContent = endpoint.name;
      pathEl.textContent = endpoint.path;
    } else {
      bar.classList.remove('active');
    }
  }

  function resetSections() {
    document.getElementById('request-section').style.display = 'none';
    document.getElementById('response-section').style.display = 'none';
    document.getElementById('verification-section').style.display = 'none';
  }

  function setupEventHandlers() {
    document.getElementById('resource-filter').addEventListener('change', (e) => {
      filterEndpoints(e.target.value);
    });

    document.getElementById('endpoint-select').addEventListener('change', (e) => {
      const endpointId = e.target.value;
      if (endpointId) {
        const endpoint = endpoints[endpointId];
        updateEndpointBar(endpoint);
        displayDocumentation(endpoint);
        generateParamsForm(endpoint);
        resetSections();
      } else {
        updateEndpointBar(null);
        document.getElementById('params-section').innerHTML = '';
        document.getElementById('docs-section').innerHTML = '';
        resetSections();
      }
    });

    document.querySelector('.close').addEventListener('click', () => {
      document.getElementById('api-qa-tool').remove();
    });
  }

  // ===== GLOBAL FUNCTIONS =====

  window.qaExecute = async function() {
    const endpointId = document.getElementById('endpoint-select').value;
    if (!endpointId) {
      alert('Please select an endpoint');
      return;
    }

    const endpoint = endpoints[endpointId];
    const sessionId = getSessionId();

    if (!sessionId) {
      alert('Session ID not found. Please log in to Gmail.');
      return;
    }

    const params = {};
    const paramNames = endpoint.paramsConfig
      ? endpoint.paramsConfig.map(p => p.name)
      : [];

    paramNames.forEach(param => {
      const input = document.getElementById(`param-${param}`);
      if (input && input.value) {
        params[param] = input.value;
      }
    });

    if (endpoint.paramsConfig) {
      for (let param of endpoint.paramsConfig) {
        if (param.required && !params[param.name]) {
          alert(`${param.label} is required`);
          return;
        }
      }
    }

    const url = buildRequestUrl(endpoint, params);
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    };

    let requestBody = null;
    if (['POST', 'PATCH', 'PUT'].includes(endpoint.method)) {
      requestBody = buildRequestBody(endpoint, params);
      if (Object.keys(requestBody).length > 0) {
        options.body = JSON.stringify(requestBody);
      }
    }

    displayRequest(endpoint, url, requestBody);

    const startTime = Date.now();
    try {
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      let data;

      // Handle empty responses (common for DELETE 204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        data = { message: 'Success - No content returned' };
      } else {
        const contentType = response.headers.get('content-type');
        const text = await response.text();

        // Try to parse as JSON, fallback to text
        if (contentType && contentType.includes('application/json') && text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text || { message: 'Success - Empty response' };
          }
        } else {
          data = text || { message: 'Success - Empty response' };
        }
      }

      displayResponse(response.status, responseTime, data);
    } catch (error) {
      displayError(error.message);
    }
  };

  window.handleVerification = function(result) {
    const issueDetails = document.getElementById('issue-details');

    if (result === 'yes') {
      issueDetails.innerHTML = `
        <div class="success-message">
          <p>✅ Test passed! The API behavior matches the documentation.</p>
        </div>
      `;
      issueDetails.style.display = 'block';
    } else {
      issueDetails.innerHTML = `
        <div class="issue-form">
          <label for="issue-description">Describe the issue:</label>
          <textarea id="issue-description" rows="5" placeholder="What doesn't match? What did you expect vs. what happened?"></textarea>
          <button onclick="window.generateBugReport()" class="copy-btn">📋 Copy Bug Report</button>
        </div>
      `;
      issueDetails.style.display = 'block';
    }
  };

  window.generateBugReport = function() {
    const endpointId = document.getElementById('endpoint-select').value;
    const endpoint = endpoints[endpointId];
    const issueDescription = document.getElementById('issue-description').value;

    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    const requestSection = document.getElementById('request-section');
    const responseSection = document.getElementById('response-section');

    const report = `
=== Gmail API Bug Report ===

Endpoint: ${endpoint.name}
Method: ${endpoint.method}
Path: ${endpoint.path}

${requestSection.innerText}

${responseSection.innerText}

Issue Description:
${issueDescription}

Documentation Reference:
${endpoint.docs}

Tested on: ${new Date().toLocaleString()}
Browser: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(report).then(() => {
      alert('✅ Bug report copied to clipboard!');
    }).catch(err => {
      const textarea = document.createElement('textarea');
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ Bug report copied to clipboard!');
    });
  };

  window.quickRunList = function(resourceType) {
    const listEndpoints = {
      labels: 'list-labels',
      threads: 'list-threads',
      messages: 'list-messages',
      drafts: 'list-drafts'
    };

    const endpointId = listEndpoints[resourceType];
    if (endpointId) {
      document.getElementById('endpoint-select').value = endpointId;
      document.getElementById('endpoint-select').dispatchEvent(new Event('change'));

      showToast(`Running "List ${capitalize(resourceType)}"...`, 'info');

      setTimeout(() => {
        window.qaExecute();
      }, 300);
    }
  };

  window.handleAutocompleteFilter = function(value, resourceType, fieldId) {
    const suggestions = getCachedSuggestions(resourceType);
    const chipsContainer = document.getElementById(`chips-${fieldId}`);

    if (!chipsContainer) return;

    const chips = chipsContainer.querySelectorAll('.example-chip');

    chips.forEach((chip, index) => {
      const suggestion = suggestions[index];
      if (!suggestion) return;

      const matchesName = suggestion.name.toLowerCase().includes(value.toLowerCase());
      const matchesId = suggestion.id.toLowerCase().includes(value.toLowerCase());

      if (matchesName || matchesId || value === '') {
        chip.style.display = '';
        chip.style.opacity = (matchesName || matchesId) ? '1' : '0.5';
      } else {
        chip.style.display = 'none';
      }
    });
  };

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===== CREATE UI PANEL =====

  const panel = document.createElement('div');
  panel.id = 'api-qa-tool';
  panel.innerHTML = `
    <style>
      #api-qa-tool {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 480px;
        max-height: calc(100vh - 40px);
        background: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        color: #333;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .qa-header {
        background: #2C3E50;
        color: white;
        padding: 15px 50px 15px 20px;
        border-radius: 8px 8px 0 0;
        position: relative;
      }

      .qa-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .endpoint-bar {
        background: #f8f9fa;
        padding: 12px 20px;
        border-bottom: 1px solid #e0e0e0;
        display: none;
      }

      .endpoint-bar.active {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .endpoint-method {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .endpoint-method.get {
        background: #e6f4ea;
        color: #137333;
      }

      .endpoint-method.post {
        background: #fef7e0;
        color: #b06000;
      }

      .endpoint-method.patch,
      .endpoint-method.put {
        background: #e8f0fe;
        color: #1967d2;
      }

      .endpoint-method.delete {
        background: #fce8e6;
        color: #c5221f;
      }

      .endpoint-name {
        font-weight: 600;
        color: #333;
        font-size: 14px;
      }

      .endpoint-path {
        flex: 1;
        font-family: 'Courier New', Consolas, monospace;
        font-size: 12px;
        color: #5f6368;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        border-radius: 4px;
        line-height: 32px;
        text-align: center;
        padding: 0;
        transition: background 0.2s;
      }

      .close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .qa-content {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(100vh - 120px);
      }

      .form-group {
        margin-bottom: 18px;
      }

      .form-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 6px;
        color: #333;
      }

      .badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 3px;
        margin-left: 6px;
        text-transform: uppercase;
      }

      .badge.required {
        background: #fce8e6;
        color: #d93025;
      }

      .badge.optional {
        background: #e8f0fe;
        color: #1967d2;
      }

      .badge.default {
        background: #e6f4ea;
        color: #137333;
        font-size: 10px;
        text-transform: none;
      }

      .param-input {
        width: 100%;
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
        font-family: inherit;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .param-input:focus {
        border-color: #2C3E50;
        outline: none;
        box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
      }

      .param-help {
        margin-top: 6px;
        font-size: 12px;
        color: #5f6368;
        line-height: 1.4;
      }

      .param-options {
        margin-top: 8px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 12px;
      }

      .option-item {
        margin-bottom: 6px;
        line-height: 1.4;
      }

      .option-item:last-child {
        margin-bottom: 0;
      }

      .option-item strong {
        color: #2C3E50;
      }

      .param-examples {
        margin-top: 10px;
        padding: 10px;
        background: #e8f0fe;
        border-radius: 4px;
        border-left: 3px solid #2C3E50;
      }

      .param-examples strong {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        color: #2C3E50;
      }

      .example-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .example-chip {
        background: white;
        border: 1px solid #2C3E50;
        color: #2C3E50;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
      }

      .example-chip:hover {
        background: #2C3E50;
        color: white;
      }

      .no-cache-hint {
        margin-top: 10px;
        padding: 12px;
        background: #fff4e5;
        border-radius: 4px;
        border-left: 3px solid #f4b400;
      }

      .no-cache-hint p {
        margin: 0 0 8px 0;
        color: #5f6368;
        font-size: 13px;
      }

      .helper-btn {
        background: #f4b400;
        color: #000;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .helper-btn:hover {
        background: #ea9a00;
      }

      .docs-enhanced {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;
        border-left: 4px solid #2C3E50;
      }

      .docs-header {
        margin-bottom: 10px;
      }

      .docs-header strong {
        font-size: 15px;
        color: #2C3E50;
      }

      .method-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 700;
        margin-right: 8px;
        text-transform: uppercase;
      }

      .method-badge.get {
        background: #e6f4ea;
        color: #137333;
      }

      .method-badge.post {
        background: #e8f0fe;
        color: #1967d2;
      }

      .method-badge.patch,
      .method-badge.put {
        background: #fef7e0;
        color: #b06000;
      }

      .method-badge.delete {
        background: #fce8e6;
        color: #c5221f;
      }

      .docs-description {
        margin-bottom: 12px;
        line-height: 1.5;
        color: #3c4043;
      }

      .docs-params-overview {
        background: white;
        padding: 10px;
        border-radius: 4px;
      }

      .docs-params-overview strong {
        display: block;
        margin-bottom: 8px;
        color: #2C3E50;
      }

      .docs-params-overview ul {
        margin: 0;
        padding-left: 20px;
      }

      .docs-params-overview li {
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .required-badge {
        color: #d93025;
        font-size: 11px;
        font-weight: 600;
      }

      .optional-info {
        color: #5f6368;
        font-style: italic;
      }

      .execute-btn {
        background: #2C3E50;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 15px;
        transition: background 0.2s;
      }

      .execute-btn:hover {
        background: #1a252f;
      }

      .execute-btn:active {
        background: #0f1419;
      }

      #request-section,
      #response-section,
      #verification-section {
        margin-top: 20px;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        border-left: 4px solid #2C3E50;
      }

      .section-header h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #2C3E50;
      }

      .section-header.error h4 {
        color: #d93025;
      }

      .detail-row {
        margin-bottom: 10px;
      }

      .detail-row .label {
        font-weight: 600;
        display: inline-block;
        margin-right: 8px;
      }

      .detail-row .value {
        display: inline-block;
      }

      .method-get {
        color: #0f9d58;
        font-weight: 600;
      }

      .method-post {
        color: #1a73e8;
        font-weight: 600;
      }

      .method-patch,
      .method-put {
        color: #f4b400;
        font-weight: 600;
      }

      .method-delete {
        color: #d93025;
        font-weight: 600;
      }

      .status-success {
        color: #0f9d58;
        font-weight: 600;
      }

      .status-warning {
        color: #f4b400;
        font-weight: 600;
      }

      .status-error {
        color: #d93025;
        font-weight: 600;
      }

      .code-block {
        background: white;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
        font-family: 'Courier New', Consolas, monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-all;
        margin-top: 5px;
        max-height: 300px;
        overflow-y: auto;
      }

      .verification-header h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #2C3E50;
      }

      .verification-header p {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #5f6368;
      }

      .verification-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 15px;
      }

      .radio-option {
        display: flex;
        align-items: center;
        padding: 10px;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .radio-option:hover {
        border-color: #2C3E50;
        background: #f8f9fa;
      }

      .radio-option input[type="radio"] {
        margin-right: 10px;
        cursor: pointer;
      }

      .radio-option span {
        font-size: 14px;
      }

      .success-message {
        background: #e6f4ea;
        padding: 12px;
        border-radius: 4px;
        border-left: 4px solid #0f9d58;
        color: #137333;
        margin-top: 10px;
      }

      .success-message p {
        margin: 0;
      }

      .issue-form {
        margin-top: 15px;
      }

      .issue-form label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: #333;
      }

      .issue-form textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
      }

      .issue-form textarea:focus {
        border-color: #2C3E50;
        outline: none;
        box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
      }

      .copy-btn {
        background: #34a853;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      }

      .copy-btn:hover {
        background: #2d8e47;
      }

      .error-details {
        background: #fce8e6;
        padding: 12px;
        border-radius: 4px;
        border-left: 4px solid #d93025;
        color: #c5221f;
      }

      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: #333;
        color: white;
        border-radius: 4px;
        font-size: 14px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s;
        z-index: 1000000;
      }

      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .toast-info {
        background: #2C3E50;
      }

      .toast-success {
        background: #0f9d58;
      }

      .qa-content::-webkit-scrollbar,
      .code-block::-webkit-scrollbar {
        width: 8px;
      }

      .qa-content::-webkit-scrollbar-track,
      .code-block::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      .qa-content::-webkit-scrollbar-thumb,
      .code-block::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .qa-content::-webkit-scrollbar-thumb:hover,
      .code-block::-webkit-scrollbar-thumb:hover {
        background: #555;
      }

      select.param-input {
        cursor: pointer;
      }
    </style>

    <div class="qa-header">
      <button class="close">×</button>
      <h3>Gmail API QA Tool</h3>
    </div>

    <div id="endpoint-bar" class="endpoint-bar">
      <span id="endpoint-method" class="endpoint-method"></span>
      <span id="endpoint-name" class="endpoint-name"></span>
      <span id="endpoint-path" class="endpoint-path"></span>
    </div>

    <div class="qa-content">
      <div class="form-group">
        <label for="resource-filter">Resource Type:</label>
        <select id="resource-filter" class="param-input">
          <option value="all">All Resources</option>
          <option value="labels">Labels</option>
          <option value="threads">Threads</option>
          <option value="messages">Messages</option>
          <option value="drafts">Drafts</option>
        </select>
      </div>

      <div class="form-group">
        <label for="endpoint-select">Endpoint:</label>
        <select id="endpoint-select" class="param-input">
          <option value="">Select an endpoint...</option>
        </select>
      </div>

      <div id="docs-section"></div>

      <div id="params-section"></div>

      <button class="execute-btn" onclick="window.qaExecute()">Execute API Call</button>

      <div id="request-section" style="display: none;"></div>

      <div id="response-section" style="display: none;"></div>

      <div id="verification-section" style="display: none;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  setupEventHandlers();

  filterEndpoints('all');

  console.log('✅ Gmail API QA Tool (Autocomplete) loaded successfully!');
  console.log('📝 20 endpoints with smart autocomplete for IDs');
  console.log('🎨 Dark slate theme with cached list responses');

})();
