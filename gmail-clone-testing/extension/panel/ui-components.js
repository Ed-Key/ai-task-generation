/**
 * UI Components - Form rendering with autocomplete support
 */

// ===== RESPONSE CACHE =====
export const responseCache = {
  labels: [],
  threads: [],
  messages: [],
  drafts: [],
  lastUpdated: null
};

/**
 * Cache response data from List operations for autocomplete
 * @param {Object} data - API response data
 */
export function cacheResponseData(data) {
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

/**
 * Get cached suggestions for autocomplete
 * @param {string} resourceType - Resource type (labels, threads, messages, drafts)
 * @returns {Array} Array of suggestion objects
 */
export function getCachedSuggestions(resourceType) {
  const cached = responseCache[resourceType] || [];
  return cached.map(item => ({
    id: item.id,
    name: item.name || item.snippet || (item.id.substring(0, 30) + '...'),
    rawItem: item
  }));
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Render ID field with autocomplete suggestions
 * @param {Object} param - Parameter configuration
 * @param {string} resourceType - Resource type for suggestions
 * @returns {string} HTML string
 */
export function renderIdFieldWithAutocomplete(param, resourceType) {
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
             placeholder="${param.placeholder}">

      ${hasCache ? `
        <div class="param-examples autocomplete-suggestions">
          <strong>💡 Available ${resourceType}:</strong>
          <div class="example-chips" id="chips-${param.name}">
            ${suggestions.map(s => `
              <button class="example-chip" data-param="${param.name}" data-value="${s.id}" title="${s.id}">
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
        </div>
      `}
    </div>
  `;
}

/**
 * Render a single parameter input field
 * @param {Object} param - Parameter configuration
 * @param {string} resourceType - Resource type (for ID fields)
 * @returns {string} HTML string
 */
export function renderParam(param, resourceType = null) {
  if (param.type === 'id') {
    return renderIdFieldWithAutocomplete(param, resourceType);
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
                <button class="example-chip" data-param="${param.name}" data-value="${ex.query}" title="${ex.description}">
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
                <button class="example-chip" data-param="${param.name}" data-value="${ex.value}" data-append="true" title="${ex.description}">
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

/**
 * Generate complete params form for an endpoint
 * @param {Object} endpoint - Endpoint configuration
 * @returns {string} HTML string
 */
export function generateParamsForm(endpoint) {
  if (!endpoint.paramsConfig || endpoint.paramsConfig.length === 0) {
    return '';
  }

  let html = '<div class="params-form">';
  endpoint.paramsConfig.forEach(param => {
    html += renderParam(param, endpoint.resource);
  });
  html += '</div>';

  return html;
}

/**
 * Setup event listeners for example chips (call after form is rendered)
 * @param {HTMLElement} container - Container element with form
 */
export function setupExampleChipListeners(container) {
  const chips = container.querySelectorAll('.example-chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const paramName = chip.dataset.param;
      const value = chip.dataset.value;
      const shouldAppend = chip.dataset.append === 'true';

      const input = document.getElementById(`param-${paramName}`);
      if (input) {
        if (shouldAppend && input.value) {
          // For array params, append with comma
          input.value += `,${value}`;
        } else {
          // For regular params, replace value
          input.value = value;
        }
      }
    });
  });
}
