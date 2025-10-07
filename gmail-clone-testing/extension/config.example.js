/**
 * Gmail API OAuth Configuration Template
 *
 * SETUP INSTRUCTIONS FOR NEW USERS:
 *
 * 1. Create a Google Cloud Project:
 *    - Go to https://console.cloud.google.com
 *    - Create a new project or select existing one
 *
 * 2. Enable Gmail API:
 *    - In the Cloud Console, go to "APIs & Services" > "Library"
 *    - Search for "Gmail API" and click "Enable"
 *
 * 3. Create OAuth 2.0 Credentials:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "OAuth client ID"
 *    - Application type: "Desktop app" (or "Web application")
 *    - Download the credentials.json file
 *    - Extract client_id and client_secret from the JSON
 *
 * 4. Get Refresh Token:
 *    Option A - Use OAuth Playground:
 *      - Go to https://developers.google.com/oauthplayground
 *      - Click settings (gear icon), check "Use your own OAuth credentials"
 *      - Enter your client_id and client_secret
 *      - In Step 1, enter scope: https://www.googleapis.com/auth/gmail.modify
 *      - Click "Authorize APIs" and complete OAuth flow
 *      - In Step 2, click "Exchange authorization code for tokens"
 *      - Copy the "Refresh token" value
 *
 *    Option B - Use Python script (if you have one):
 *      - Run your Python OAuth flow script
 *      - It will generate a refresh token
 *
 * 5. Create config.js:
 *    - Copy this file: cp config.example.js config.js
 *    - Replace the values below with your credentials
 *
 * SECURITY NOTE:
 * - config.js is gitignored and will NEVER be committed to the repository
 * - Never share your client_secret or refresh_token publicly
 * - These credentials give full access to your Gmail account
 */

export const CONFIG = {
  // Your OAuth 2.0 Client ID from Google Cloud Console
  // Example: '123456789-abc123def456.apps.googleusercontent.com'
  clientId: 'YOUR_CLIENT_ID_HERE',

  // Your OAuth 2.0 Client Secret from Google Cloud Console
  // Example: 'GOCSPX-abc123def456ghi789'
  clientSecret: 'YOUR_CLIENT_SECRET_HERE',

  // Your OAuth 2.0 Refresh Token (from OAuth Playground or Python script)
  // Example: '1//0abc123def456...'
  refreshToken: 'YOUR_REFRESH_TOKEN_HERE'
};
