/**
 * Dual-Mode API Client
 * Provides unified interface for calling both real Gmail API (OAuth) and clone API (sessionId)
 */

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
   */
  async executeRequest(endpoint, method, params, body) {
    try {
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
   */
  async executeRequest(endpoint, method, params, body) {
    try {
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
