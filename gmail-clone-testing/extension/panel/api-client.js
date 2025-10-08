/**
 * Dual-Mode API Client
 * Provides unified interface for calling both real Gmail API (OAuth) and clone API (sessionId)
 */

/**
 * Helper function to encode email for Gmail API send
 * Converts email parameters to RFC 2822 format and base64url encodes
 * @param {Object} params - Email parameters (to, subject, body)
 * @returns {Object} Encoded email in format { raw: base64url_string }
 */
function encodeEmailForSend(params) {
  // Build RFC 2822 compliant email
  const emailLines = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',  // Blank line separates headers from body
    params.body
  ];

  const rawEmail = emailLines.join('\n');

  // Base64URL encode (note: different from regular base64)
  // - Replace + with -
  // - Replace / with _
  // - Remove padding (=)
  const base64Email = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { raw: base64Email };
}

/**
 * Base API client interface
 */
class BaseApiClient {
  buildUrl(path, params) {
    let url = this.baseUrl + path;

    // Create a copy to avoid mutating the original params object
    const paramsCopy = { ...params };

    // Replace path variables (e.g., {id} -> Label_123)
    Object.keys(paramsCopy).forEach(key => {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, paramsCopy[key]);
        delete paramsCopy[key]; // Remove from copy so it doesn't go in query string
      }
    });

    // Add remaining params as query string
    const queryParams = Object.keys(paramsCopy)
      .filter(key => paramsCopy[key]) // Only include non-empty values
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramsCopy[key])}`)
      .join('&');

    if (queryParams) {
      url += `?${queryParams}`;
    }

    return url;
  }
}

/**
 * Real Gmail API Client
 * Uses OAuth access tokens from background service worker
 */
class RealGmailClient extends BaseApiClient {
  constructor() {
    super();
    this.baseUrl = 'https://gmail.googleapis.com/gmail/v1';
  }

  /**
   * Get OAuth access token from background worker
   */
  async getAccessToken() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_ACCESS_TOKEN' }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.token);
        }
      });
    });
  }

  /**
   * Execute API request with OAuth authentication
   * Supports two calling patterns:
   * 1. executeRequest(endpoint, method, params, body) - single mode
   * 2. executeRequest(endpoint, method, pathParams, queryParams, bodyParams) - comparison mode
   */
  async executeRequest(endpoint, method, paramsOrPath, bodyOrQuery, maybeBody) {
    try {
      // Detect calling pattern based on number of arguments
      let params, body;

      if (arguments.length === 5) {
        // Comparison mode: (endpoint, method, pathParams, queryParams, bodyParams)
        const pathParams = paramsOrPath;
        const queryParams = bodyOrQuery;
        const bodyParams = maybeBody;

        // Merge path and query params for URL building
        params = { ...pathParams, ...queryParams };
        body = bodyParams;
      } else {
        // Single mode: (endpoint, method, params, body)
        params = paramsOrPath;
        body = bodyOrQuery;
      }

      // Build URL
      const url = this.buildUrl(endpoint, { ...params });

      // Get OAuth token
      const token = await this.getAccessToken();

      // Prepare request options
      const options = {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Special handling for send-message and draft endpoints that need email encoding
      if (body && body.to && body.subject && body.body) {
        if (endpoint.includes('/messages/send')) {
          console.log('[RealGmailClient] Encoding email for send endpoint');
          body = encodeEmailForSend(body);
        } else if (endpoint.includes('/drafts')) {
          console.log('[RealGmailClient] Encoding email for draft endpoint');
          // Drafts need the message wrapped in a message object
          body = { message: encodeEmailForSend(body) };
        }
      }

      // Add body for non-GET requests
      if (body && Object.keys(body).length > 0 && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      // Make request
      const startTime = Date.now();
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      // Parse response
      let data = null;
      const contentType = response.headers.get('content-type');

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        data = { message: 'Success - No content returned' };
      } else if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : { message: 'Success - Empty response' };
      } else {
        const text = await response.text();
        data = text || { message: 'Success - No content' };
      }

      return {
        status: response.status,
        body: data,
        error: null,
        responseTime: responseTime
      };

    } catch (error) {
      console.error('RealGmailClient error:', error);
      return {
        status: null,
        body: null,
        error: error.message,
        responseTime: 0
      };
    }
  }
}

/**
 * Clone Gmail API Client
 * Uses sessionId cookie for authentication
 */
class CloneGmailClient extends BaseApiClient {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.baseUrl = 'https://gmail.matrices.ai/gmail/v1';
  }

  /**
   * Execute API request with sessionId authentication
   * Supports two calling patterns:
   * 1. executeRequest(endpoint, method, params, body) - single mode
   * 2. executeRequest(endpoint, method, pathParams, queryParams, bodyParams) - comparison mode
   */
  async executeRequest(endpoint, method, paramsOrPath, bodyOrQuery, maybeBody) {
    try {
      // Detect calling pattern based on number of arguments
      let params, body;

      if (arguments.length === 5) {
        // Comparison mode: (endpoint, method, pathParams, queryParams, bodyParams)
        const pathParams = paramsOrPath;
        const queryParams = bodyOrQuery;
        const bodyParams = maybeBody;

        // Merge path and query params for URL building
        params = { ...pathParams, ...queryParams };
        body = bodyParams;
      } else {
        // Single mode: (endpoint, method, params, body)
        params = paramsOrPath;
        body = bodyOrQuery;
      }

      // Build URL
      const url = this.buildUrl(endpoint, { ...params });

      // Prepare request options
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies
      };

      // Special handling for send-message and draft endpoints that need email encoding
      if (body && body.to && body.subject && body.body) {
        if (endpoint.includes('/messages/send')) {
          console.log('[CloneGmailClient] Encoding email for send endpoint');
          body = encodeEmailForSend(body);
        } else if (endpoint.includes('/drafts')) {
          console.log('[CloneGmailClient] Encoding email for draft endpoint');
          // Drafts need the message wrapped in a message object
          body = { message: encodeEmailForSend(body) };
        }
      }

      // Add body for non-GET requests
      if (body && Object.keys(body).length > 0 && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      // Make request
      const startTime = Date.now();
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      // Parse response
      let data = null;
      const contentType = response.headers.get('content-type');

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        data = { message: 'Success - No content returned' };
      } else if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : { message: 'Success - Empty response' };
      } else {
        const text = await response.text();
        data = text || { message: 'Success - No content' };
      }

      return {
        status: response.status,
        body: data,
        error: null,
        responseTime: responseTime
      };

    } catch (error) {
      console.error('CloneGmailClient error:', error);
      return {
        status: null,
        body: null,
        error: error.message,
        responseTime: 0
      };
    }
  }
}

/**
 * Factory function to get appropriate API client
 * @param {string} site - 'real' or 'clone'
 * @param {string} sessionId - Session ID for clone (optional)
 * @returns {BaseApiClient} API client instance
 */
export function getApiClient(site, sessionId = null) {
  if (site === 'real') {
    return new RealGmailClient();
  } else if (site === 'clone') {
    if (!sessionId) {
      throw new Error('sessionId required for clone API client');
    }
    return new CloneGmailClient(sessionId);
  } else {
    throw new Error(`Unknown site: ${site}`);
  }
}
