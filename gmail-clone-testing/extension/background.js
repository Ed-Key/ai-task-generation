/**
 * Background Service Worker - OAuth Token Manager
 *
 * WHAT THIS DOES:
 * Manages OAuth 2.0 access tokens for authenticating with the real Gmail API.
 *
 * HOW OAUTH REFRESH FLOW WORKS:
 * 1. You obtain a "refresh token" once through initial OAuth consent flow
 * 2. The refresh token is long-lived (doesn't expire) and stored in config.js
 * 3. Access tokens expire after ~1 hour and are used for actual API calls
 * 4. When an access token expires, we exchange the refresh token for a new one
 *
 * IMPLEMENTATION PATTERN:
 * - When panel requests a token: Check cache → If valid, return it
 * - If expired or missing: POST to oauth2.googleapis.com/token with refresh_token
 * - Google responds with new access_token + expires_in (usually 3600 seconds)
 * - Cache the new token with expiry timestamp in chrome.storage.local
 * - Return token to panel for Authorization: Bearer {token} header
 *
 * WHY EXTENSION CAN DO THIS (but browser scripts can't):
 * Chrome extensions have host_permissions that bypass CORS, allowing direct
 * calls to oauth2.googleapis.com/token which would be blocked in a normal
 * browser context.
 */

import { CONFIG } from './config.js';

const TOKEN_STORAGE_KEY = 'gmail_access_token';
const TOKEN_EXPIRY_KEY = 'gmail_token_expiry';
const TOKEN_REFRESH_URL = 'https://oauth2.googleapis.com/token';

/**
 * Get a valid access token (from cache or by refreshing)
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  try {
    // Check if we have a cached token that hasn't expired
    const stored = await chrome.storage.local.get([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
    const now = Date.now();

    if (stored[TOKEN_STORAGE_KEY] && stored[TOKEN_EXPIRY_KEY]) {
      const expiryTime = stored[TOKEN_EXPIRY_KEY];

      // If token expires in more than 5 minutes, use it
      if (expiryTime - now > 5 * 60 * 1000) {
        console.log('[OAuth] Using cached access token (expires in',
                    Math.round((expiryTime - now) / 1000), 'seconds)');
        return stored[TOKEN_STORAGE_KEY];
      }
    }

    // Token expired or doesn't exist, refresh it
    console.log('[OAuth] Token expired or missing, refreshing...');
    return await refreshAccessToken();

  } catch (error) {
    console.error('[OAuth] Error getting access token:', error);
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<string>} New access token
 */
async function refreshAccessToken() {
  try {
    console.log('[OAuth] Requesting new access token from Google...');

    // Exchange refresh token for access token
    const response = await fetch(TOKEN_REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: CONFIG.refreshToken,
        client_id: CONFIG.clientId,
        client_secret: CONFIG.clientSecret,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth refresh failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access_token in refresh response');
    }

    // Calculate expiry time (expires_in is in seconds)
    const expiresIn = data.expires_in || 3600; // Default 1 hour
    const expiryTime = Date.now() + (expiresIn * 1000);

    // Store in chrome.storage
    await chrome.storage.local.set({
      [TOKEN_STORAGE_KEY]: data.access_token,
      [TOKEN_EXPIRY_KEY]: expiryTime
    });

    console.log('[OAuth] ✓ New access token obtained (expires in', expiresIn, 'seconds)');

    return data.access_token;

  } catch (error) {
    console.error('[OAuth] Error refreshing token:', error);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}

/**
 * Clear stored tokens (useful for debugging)
 */
async function clearTokens() {
  await chrome.storage.local.remove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
  console.log('[OAuth] Tokens cleared from storage');
}

/**
 * Message handler for requests from content scripts and panel
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_ACCESS_TOKEN') {
    // Handle async token request
    getAccessToken()
      .then(token => {
        sendResponse({ success: true, token });
      })
      .catch(error => {
        console.error('[OAuth] Failed to get token for request:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  }

  if (request.type === 'CLEAR_TOKENS') {
    // Debug command to clear tokens
    clearTokens()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[OAuth] Extension installed, tokens will be fetched on first use');
  } else if (details.reason === 'update') {
    console.log('[OAuth] Extension updated');
  }
});

// Log that the service worker is running
console.log('[OAuth] Background service worker initialized');
console.log('[OAuth] Client ID:', CONFIG.clientId ? '✓ Configured' : '✗ Missing');
console.log('[OAuth] Client Secret:', CONFIG.clientSecret ? '✓ Configured' : '✗ Missing');
console.log('[OAuth] Refresh Token:', CONFIG.refreshToken ? '✓ Configured' : '✗ Missing');
