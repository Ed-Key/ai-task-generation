/**
 * Diff Renderer - Visual comparison display with color-coded highlighting
 * Generates HTML for side-by-side (vertical) comparison of API responses
 */

/**
 * Render complete comparison view with diff highlighting
 * @param {Object} realResult - Real Gmail API result
 * @param {Object} cloneResult - Clone Gmail API result
 * @param {Object} diff - Diff analysis from ComparisonEngine
 * @returns {string} HTML string for comparison view
 */
export function renderComparisonView(realResult, cloneResult, diff) {
  return `
    <div class="comparison-container">
      ${renderDiffSummary(diff)}
      ${renderApiSection(realResult, 'real', diff)}
      <div class="comparison-divider">⚖️ vs</div>
      ${renderApiSection(cloneResult, 'clone', diff)}
    </div>
  `;
}

/**
 * Render diff summary bar with match/mismatch status
 * @param {Object} diff - Diff analysis result
 * @returns {string} HTML string for diff summary
 */
export function renderDiffSummary(diff) {
  const isMatch = !diff.hasDifferences;
  const statusClass = isMatch ? 'match' : 'mismatch';
  const statusIcon = isMatch ? '✓' : '⚠️';
  const statusText = isMatch
    ? 'Responses Match'
    : `${diff.summary.count} Difference${diff.summary.count !== 1 ? 's' : ''} Found`;

  let detailsHtml = '';
  if (!isMatch && diff.details && diff.details.length > 0) {
    detailsHtml = `
      <div class="diff-details">
        <strong>Differences:</strong>
        <ul>
          ${formatDiffDetails(diff.details)}
        </ul>
      </div>
    `;
  }

  return `
    <div class="diff-summary ${statusClass}">
      <div>
        <span class="diff-status ${isMatch ? 'success' : 'warning'}">
          ${statusIcon} ${statusText}
        </span>
      </div>
      ${detailsHtml}
    </div>
  `;
}

/**
 * Render single API section (Real or Clone)
 * @param {Object} result - API call result
 * @param {string} mode - 'real' or 'clone'
 * @param {Object} diff - Diff analysis result
 * @returns {string} HTML string for API section
 */
export function renderApiSection(result, mode, diff) {
  const modeName = mode === 'real' ? 'Real Gmail' : 'Clone';
  const badgeClass = mode === 'real' ? 'real' : 'clone';

  // Status color coding
  let statusClass = 'status-success';
  if (result.status >= 500) statusClass = 'status-error';
  else if (result.status >= 400) statusClass = 'status-warning';

  // Request display
  const requestHtml = result.url ? `
    <div class="comparison-request">
      <strong>Request:</strong>
      <div class="code-block">
        <div><strong>${result.method || 'GET'}</strong> ${result.url}</div>
        ${result.requestBody && Object.keys(result.requestBody).length > 0 ? `<div style="margin-top: 8px;">Body: ${JSON.stringify(result.requestBody, null, 2)}</div>` : ''}
      </div>
    </div>
  ` : '';

  // Response display with diff highlighting
  const responseHtml = `
    <div class="comparison-response">
      <strong>Response:</strong>
      <div class="code-block">
        ${highlightJsonWithDiff(result.body, diff, mode, '')}
      </div>
    </div>
  `;

  return `
    <div class="comparison-section ${mode}">
      <div class="comparison-header">
        <span class="mode-badge ${badgeClass}">${modeName}</span>
        <span class="${statusClass}">${result.status || 'Error'} ${getStatusText(result.status)}</span>
        <span style="color: #5f6368;">| ${result.responseTime || 0}ms</span>
      </div>
      ${requestHtml}
      ${responseHtml}
      ${result.error ? `<div class="error-message">Error: ${result.error}</div>` : ''}
    </div>
  `;
}

/**
 * Recursively highlight JSON with diff information
 * @param {*} jsonObj - JSON object to format
 * @param {Object} diff - Diff analysis result
 * @param {string} mode - 'real' or 'clone'
 * @param {string} path - Current JSON path
 * @param {number} indent - Indentation level
 * @returns {string} HTML string with highlighted JSON
 */
export function highlightJsonWithDiff(jsonObj, diff, mode, path = '', indent = 0) {
  const indentStr = '  '.repeat(indent);

  // Handle null/undefined
  if (jsonObj === null) {
    return `<span class="${getDiffClassForPath(diff, path, mode)}">null</span>`;
  }
  if (jsonObj === undefined) {
    return `<span class="${getDiffClassForPath(diff, path, mode)}">undefined</span>`;
  }

  // Handle arrays
  if (Array.isArray(jsonObj)) {
    if (jsonObj.length === 0) {
      return '[]';
    }

    const items = jsonObj.map((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      const highlighted = highlightJsonWithDiff(item, diff, mode, itemPath, indent + 1);
      return `${indentStr}  ${highlighted}`;
    }).join(',\n');

    return `[\n${items}\n${indentStr}]`;
  }

  // Handle objects
  if (typeof jsonObj === 'object') {
    const keys = Object.keys(jsonObj);
    if (keys.length === 0) {
      return '{}';
    }

    const items = keys.map(key => {
      const valuePath = path ? `${path}.${key}` : key;
      const value = jsonObj[key];
      const highlighted = highlightJsonWithDiff(value, diff, mode, valuePath, indent + 1);
      const diffClass = getDiffClassForPath(diff, valuePath, mode);

      return `${indentStr}  <span class="${diffClass}">"${key}": ${highlighted}</span>`;
    }).join(',\n');

    return `{\n${items}\n${indentStr}}`;
  }

  // Handle primitives
  const diffClass = getDiffClassForPath(diff, path, mode);
  const valueStr = typeof jsonObj === 'string' ? `"${jsonObj}"` : String(jsonObj);
  return `<span class="${diffClass}">${valueStr}</span>`;
}

/**
 * Get CSS class for diff highlighting based on path
 * @param {Object} diff - Diff analysis result
 * @param {string} path - JSON path to check
 * @param {string} mode - 'real' or 'clone'
 * @returns {string} CSS class name
 */
export function getDiffClassForPath(diff, path, mode) {
  if (!diff || !diff.details) {
    return '';
  }

  // Check if this exact path has a difference
  const difference = diff.details.find(d => d.path === path);

  if (difference) {
    // This path has an explicit difference
    switch (difference.type) {
      case 'value_mismatch':
      case 'type_mismatch':
      case 'array_length_mismatch':
        return 'diff-mismatch';

      case 'missing_in_real':
        return mode === 'clone' ? 'diff-mismatch' : '';

      case 'missing_in_clone':
        return mode === 'real' ? 'diff-mismatch' : '';

      default:
        return '';
    }
  }

  // No explicit difference at this path
  if (isIgnoredField(path, diff)) {
    return 'diff-ignored';
  }

  // Check if this path is inside a completely different structure
  // Only mark as mismatch if the IMMEDIATE parent has a type mismatch
  if (diff.hasDifferences && path) {
    // Extract the immediate parent path
    let parentPath = '';
    if (path.includes('.')) {
      const lastDot = path.lastIndexOf('.');
      parentPath = path.substring(0, lastDot);
    } else if (path.includes('[')) {
      const lastBracket = path.lastIndexOf('[');
      parentPath = path.substring(0, lastBracket);
    }

    // Check if immediate parent has a TYPE mismatch (not just value difference)
    const parentDiff = diff.details.find(d => d.path === parentPath);
    if (parentDiff && parentDiff.type === 'type_mismatch') {
      return 'diff-mismatch';
    }

    // Check root level type mismatch (completely different response structures)
    const rootDiff = diff.details.find(d => d.path === '<root>');
    if (rootDiff && rootDiff.type === 'type_mismatch') {
      return 'diff-mismatch';
    }

    // No difference at this path and parent structure is compatible - it's a match
    return 'diff-match';
  }

  return '';
}

/**
 * Check if field is an ignored field (like ID)
 * @param {string} path - JSON path
 * @param {Object} diff - Diff analysis (may contain ignore info)
 * @returns {boolean} True if field is ignored
 */
function isIgnoredField(path, diff) {
  // Common ignored field patterns
  const ignoredPatterns = ['id', 'labelId', 'threadId', 'messageId', 'historyId'];
  const fieldName = path.split('.').pop().split('[')[0];
  return ignoredPatterns.includes(fieldName);
}

/**
 * Format diff details as HTML list items
 * @param {Array<Object>} details - Array of difference objects
 * @returns {string} HTML string with list items
 */
export function formatDiffDetails(details) {
  // Group by severity
  const high = details.filter(d => d.severity === 'high');
  const medium = details.filter(d => d.severity === 'medium');
  const low = details.filter(d => d.severity === 'low');

  const items = [];

  // High severity first
  high.forEach(d => {
    items.push(`<li><strong>${d.path}</strong>: ${formatDiffMessage(d)}</li>`);
  });

  // Then medium
  medium.forEach(d => {
    items.push(`<li>${d.path}: ${formatDiffMessage(d)}</li>`);
  });

  // Then low
  low.forEach(d => {
    items.push(`<li style="color: #5f6368;">${d.path}: ${formatDiffMessage(d)}</li>`);
  });

  return items.join('');
}

/**
 * Format a single diff message
 * @param {Object} diff - Difference object
 * @returns {string} Formatted message
 */
function formatDiffMessage(diff) {
  switch (diff.type) {
    case 'value_mismatch':
      return `Real="${diff.real}" vs Clone="${diff.clone}"`;

    case 'type_mismatch':
      return `Type mismatch (${diff.message})`;

    case 'missing_in_real':
      return `Missing in Real (Clone has: ${JSON.stringify(diff.clone)})`;

    case 'missing_in_clone':
      return `Missing in Clone (Real has: ${JSON.stringify(diff.real)})`;

    case 'array_length_mismatch':
      return `Array length: Real[${diff.real}] vs Clone[${diff.clone}]`;

    default:
      return diff.message || 'Unknown difference';
  }
}

/**
 * Get HTTP status text
 * @param {number} status - HTTP status code
 * @returns {string} Status text
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
  return statusTexts[status] || '';
}
