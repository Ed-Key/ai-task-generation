/**
 * Gmail API QA Tool - Enhanced Version
 * Browser console script for testing Gmail API clone endpoints
 * Features: Smart dropdowns, inline help, examples, validation
 * Usage: Paste this entire script into the browser console (F12) on gmail.matrices.ai
 */


(function() {
  'use strict';

  // Remove existing panel if present
  const existing = document.getElementById('api-qa-tool');
  if (existing) existing.remove();

  // ===== PARAMETER METADATA (centralized parameter definitions) =====
  const parameterMetadata = {
    // Label parameters
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
        {
          value: 'labelShow',
          label: 'Always Show',
          description: 'Label always appears in sidebar'
        },
        {
          value: 'labelShowIfUnread',
          label: 'Show If Unread',
          description: 'Label appears only when it has unread messages'
        },
        {
          value: 'labelHide',
          label: 'Hide',
          description: 'Label never appears in sidebar (accessible via search)'
        }
      ],
      defaultValue: 'labelShow',
      required: false
    },

    'messageListVisibility': {
      type: 'enum',
      label: 'Message List Visibility',
      helpText: 'Control whether messages with this label appear in your message list',
      options: [
        {
          value: 'show',
          label: 'Show in List',
          description: 'Messages appear in message list'
        },
        {
          value: 'hide',
          label: 'Hide from List',
          description: 'Messages are hidden from message list'
        }
      ],
      defaultValue: 'show',
      required: false
    },

    // Search and filter parameters
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

    // ID parameters
    'id': {
      type: 'id',
      label: 'ID',
      placeholder: 'e.g., Label_123 or 18c5f8a9b2d3e4f5',
      helpText: 'Use a "List" endpoint first to find the ID you need',
      required: true
    },

    // Array parameters
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

    // Integer parameters
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

    // Email composition parameters
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

  // ===== ENDPOINTS CONFIGURATION WITH ENHANCED PARAMS =====
  const endpoints = {
    // ===== LABELS (5) =====
    'list-labels': {
      id: 'list-labels',
      name: 'List Labels',
      resource: 'labels',
      method: 'GET',
      path: '/gmail/v1/users/me/labels',
      params: [],
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
      docs: 'Creates a new label with the specified name and visibility settings. The label will appear in Gmail based on your visibility choices.'
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
      docs: 'Updates the name or properties of an existing label. Only provide the fields you want to change.'
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
      docs: 'Permanently deletes the specified label. This cannot be undone, but won\'t delete the messages that had this label.'
    },

    // ===== THREADS (5) =====
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
      docs: 'Lists conversation threads in your mailbox. Use search queries to filter results, or filter by specific labels.'
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
      docs: 'Modifies the labels on the specified thread. You can add labels, remove labels, or do both at the same time.'
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
      docs: 'Moves the specified thread to trash. The thread can be recovered from trash within 30 days.'
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
      docs: 'Permanently deletes the specified thread and all its messages. This cannot be undone.'
    },

    // ===== MESSAGES (5) =====
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
      docs: 'Lists individual messages in your mailbox. Use search queries like "is:unread" or "from:sender@example.com" to filter results.'
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
      docs: 'Gets the specified message with full details including headers, body, and attachments.'
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
      docs: 'Modifies the labels on the specified message. For example, remove UNREAD to mark as read, or add STARRED to star the message.'
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
      docs: 'Moves the specified message to trash. The message can be recovered from trash within 30 days.'
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
      docs: 'Permanently deletes the specified message. This cannot be undone.'
    },

    // ===== DRAFTS (5) =====
    'list-drafts': {
      id: 'list-drafts',
      name: 'List Drafts',
      resource: 'drafts',
      method: 'GET',
      path: '/gmail/v1/users/me/drafts',
      paramsConfig: [
        { ...parameterMetadata.maxResults, name: 'maxResults' }
      ],
      docs: 'Lists all draft messages in your mailbox. Drafts are unsent emails saved for later.'
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
      docs: 'Gets the specified draft including the message content and recipient information.'
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
      docs: 'Creates a new draft email with the specified recipient, subject, and message content. The draft will be saved in Gmail but not sent.'
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
      docs: 'Updates an existing draft with new recipient, subject, or content. This replaces the entire draft with the new information.'
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
      docs: 'Sends the specified draft to its recipients. The draft will be deleted and the sent message will appear in your Sent folder.'
    }
  };

  // ===== HELPER FUNCTIONS =====

  /**
   * Extract session ID from browser cookies
   */
  function getSessionId() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionId') return value;
    }
    return null;
  }

  /**
   * Convert camelCase to Title Case
   */
  function formatParamName(param) {
    return param
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get HTTP status text
   */
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

  /**
   * Filter endpoints by resource type
   */
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

    // Reset sections
    document.getElementById('params-section').innerHTML = '';
    document.getElementById('docs-section').innerHTML = '';
    resetSections();
  }

  /**
   * Display enhanced endpoint documentation
   */
  function displayDocumentation(endpoint) {
    const section = document.getElementById('docs-section');

    let html = `
      <div class="docs-enhanced">
        <div class="docs-header">
          <span class="method-badge ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
          <strong>${endpoint.name}</strong>
        </div>

        <div class="docs-description">
          ${endpoint.docs}
        </div>
    `;

    // Show what parameters are needed (overview)
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

      html += `
          </ul>
        </div>
      `;
    }

    html += `</div>`;
    section.innerHTML = html;
  }

  /**
   * Render a single parameter input based on its type
   */
  function renderParam(param) {
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

    // Render based on parameter type
    switch (param.type) {
      case 'enum':
        // Dropdown select for enum types
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
        // Search input with examples
        inputHtml = `
          <input type="text"
                 id="param-${param.name}"
                 class="param-input"
                 placeholder="${param.placeholder}">
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
        // Array input with examples
        inputHtml = `
          <input type="text"
                 id="param-${param.name}"
                 class="param-input"
                 placeholder="${param.placeholder}">
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
        // Textarea for long text
        inputHtml = `
          <textarea id="param-${param.name}"
                    class="param-input"
                    rows="${param.rows || 4}"
                    placeholder="${param.placeholder}"></textarea>
        `;
        break;

      case 'number':
        // Number input with min/max
        inputHtml = `
          <input type="number"
                 id="param-${param.name}"
                 class="param-input"
                 placeholder="${param.placeholder}"
                 ${param.min ? `min="${param.min}"` : ''}
                 ${param.max ? `max="${param.max}"` : ''}
                 ${param.defaultValue ? `value="${param.defaultValue}"` : ''}>
        `;
        break;

      default:
        // Default text input
        inputHtml = `
          <input type="text"
                 id="param-${param.name}"
                 class="param-input"
                 placeholder="${param.placeholder}">
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

  /**
   * Generate dynamic parameter form with enhanced UI
   */
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

  /**
   * Build request URL with parameters
   */
  function buildRequestUrl(endpoint, params) {
    let path = endpoint.path;
    const queryParams = [];

    // Get param names (support both old and new format)
    const paramNames = endpoint.paramsConfig
      ? endpoint.paramsConfig.map(p => p.name)
      : endpoint.params || [];

    // Replace path parameters
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

  /**
   * Build request body for POST/PATCH/PUT
   */
  function buildRequestBody(endpoint, params) {
    const body = {};

    // Get param names (support both old and new format)
    const paramNames = endpoint.paramsConfig
      ? endpoint.paramsConfig.map(p => p.name)
      : endpoint.params || [];

    paramNames.forEach(param => {
      // Skip path parameters and empty values
      if (!endpoint.path.includes(`{${param}}`) && params[param]) {
        // Handle comma-separated arrays (labelIds)
        if (param.toLowerCase().includes('labelids')) {
          body[param] = params[param].split(',').map(id => id.trim());
        } else {
          body[param] = params[param];
        }
      }
    });

    // Special handling for draft creation/update (email message)
    if (endpoint.id.includes('draft') && params.to && params.subject && params.body) {
      const message = `To: ${params.to}\r\nSubject: ${params.subject}\r\n\r\n${params.body}`;
      body.message = {
        raw: btoa(unescape(encodeURIComponent(message))).replace(/\+/g, '-').replace(/\//g, '_')
      };
      delete body.to;
      delete body.subject;
      delete body.body;
    }

    return body;
  }

  /**
   * Display request details
   */
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

  /**
   * Display response details
   */
  function displayResponse(status, time, data) {
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
  }

  /**
   * Display error
   */
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

  /**
   * Show verification section
   */
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

  /**
   * Reset all sections
   */
  function resetSections() {
    document.getElementById('request-section').style.display = 'none';
    document.getElementById('response-section').style.display = 'none';
    document.getElementById('verification-section').style.display = 'none';
  }

  /**
   * Setup event handlers
   */
  function setupEventHandlers() {
    // Resource filter change
    document.getElementById('resource-filter').addEventListener('change', (e) => {
      filterEndpoints(e.target.value);
    });

    // Endpoint selection change
    document.getElementById('endpoint-select').addEventListener('change', (e) => {
      const endpointId = e.target.value;
      if (endpointId) {
        const endpoint = endpoints[endpointId];
        displayDocumentation(endpoint);
        generateParamsForm(endpoint);
        resetSections();
      } else {
        document.getElementById('params-section').innerHTML = '';
        document.getElementById('docs-section').innerHTML = '';
        resetSections();
      }
    });

    // Close button
    document.querySelector('.close').addEventListener('click', () => {
      document.getElementById('api-qa-tool').remove();
    });
  }

  // ===== GLOBAL FUNCTIONS (exposed for onclick handlers) =====

  /**
   * Execute API call
   */
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

    // Collect parameters
    const params = {};
    const paramNames = endpoint.paramsConfig
      ? endpoint.paramsConfig.map(p => p.name)
      : endpoint.params || [];

    paramNames.forEach(param => {
      const input = document.getElementById(`param-${param}`);
      if (input && input.value) {
        params[param] = input.value;
      }
    });

    // Validate required parameters
    if (endpoint.paramsConfig) {
      for (let param of endpoint.paramsConfig) {
        if (param.required && !params[param.name]) {
          alert(`${param.label} is required`);
          return;
        }
      }
    }

    // Build request
    const url = buildRequestUrl(endpoint, params);
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    };

    // Add body for POST/PATCH/PUT
    let requestBody = null;
    if (['POST', 'PATCH', 'PUT'].includes(endpoint.method)) {
      requestBody = buildRequestBody(endpoint, params);
      if (Object.keys(requestBody).length > 0) {
        options.body = JSON.stringify(requestBody);
      }
    }

    // Display request
    displayRequest(endpoint, url, requestBody);

    // Execute API call
    const startTime = Date.now();
    try {
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type');
      const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      displayResponse(response.status, responseTime, data);
      showVerificationSection();
    } catch (error) {
      displayError(error.message);
    }
  };

  /**
   * Handle verification selection
   */
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

  /**
   * Generate and copy bug report
   */
  window.generateBugReport = function() {
    const endpointId = document.getElementById('endpoint-select').value;
    const endpoint = endpoints[endpointId];
    const issueDescription = document.getElementById('issue-description').value;

    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    // Extract request and response text
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

    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
      alert('✅ Bug report copied to clipboard!');
    }).catch(err => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ Bug report copied to clipboard!');
    });
  };

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
        background: #1a73e8;
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
        border-color: #1a73e8;
        outline: none;
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
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
        color: #1a73e8;
      }

      .param-examples {
        margin-top: 10px;
        padding: 10px;
        background: #e8f0fe;
        border-radius: 4px;
        border-left: 3px solid #1a73e8;
      }

      .param-examples strong {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        color: #1967d2;
      }

      .example-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .example-chip {
        background: white;
        border: 1px solid #1a73e8;
        color: #1a73e8;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
      }

      .example-chip:hover {
        background: #1a73e8;
        color: white;
      }

      .docs-enhanced {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;
        border-left: 4px solid #1a73e8;
      }

      .docs-header {
        margin-bottom: 10px;
      }

      .docs-header strong {
        font-size: 15px;
        color: #1a73e8;
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
        color: #1a73e8;
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
        background: #1a73e8;
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
        background: #1557b0;
      }

      .execute-btn:active {
        background: #0d47a1;
      }

      #request-section,
      #response-section,
      #verification-section {
        margin-top: 20px;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        border-left: 4px solid #1a73e8;
      }

      .section-header h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #1a73e8;
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
        color: #1a73e8;
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
        border-color: #1a73e8;
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
        border-color: #1a73e8;
        outline: none;
        box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
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

      /* Scrollbar styling */
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

    <div class="qa-content">
      <!-- Resource Filter -->
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

      <!-- Endpoint Selector -->
      <div class="form-group">
        <label for="endpoint-select">Endpoint:</label>
        <select id="endpoint-select" class="param-input">
          <option value="">Select an endpoint...</option>
        </select>
      </div>

      <!-- Documentation Section -->
      <div id="docs-section"></div>

      <!-- Dynamic Parameters Form -->
      <div id="params-section"></div>

      <!-- Execute Button -->
      <button class="execute-btn" onclick="window.qaExecute()">Execute API Call</button>

      <!-- Request Display -->
      <div id="request-section" style="display: none;"></div>

      <!-- Response Display -->
      <div id="response-section" style="display: none;"></div>

      <!-- Verification Section -->
      <div id="verification-section" style="display: none;"></div>
    </div>
  `;

  // Append panel to document
  document.body.appendChild(panel);

  // Setup event handlers
  setupEventHandlers();

  // Initialize with all endpoints
  filterEndpoints('all');

  console.log('✅ Gmail API QA Tool (Enhanced) loaded successfully!');
  console.log('📝 20 endpoints with smart UI controls');
  console.log('🎨 Dropdowns for enums, examples for search, inline help for all fields');

})();