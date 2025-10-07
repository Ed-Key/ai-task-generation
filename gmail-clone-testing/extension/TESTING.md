# Extension Testing Guide

## Phase 1 Checkpoint: OAuth Manager

### ✅ Automated Test (Node.js)
```bash
cd extension
node test-oauth.js
```

**Expected output:**
```
=== Testing OAuth Refresh Token Flow ===
✓ Configuration complete
✓ Access token received (expires in 59 minutes)
✓ Successfully authenticated with Gmail API
=== All OAuth Tests Passed ===
```

### ✅ Manual Test (Chrome Extension)

**1. Load Extension in Chrome:**
```
1. Open Chrome
2. Go to chrome://extensions
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the /extension folder
6. Extension should load without errors
```

**2. Open Background Service Worker DevTools:**
```
1. In chrome://extensions, find "Gmail API QA Tool"
2. Click "service worker" link (under "Inspect views")
3. DevTools opens showing background.js console
```

**3. Verify OAuth Manager Initialized:**
```
Look for these console logs:
[OAuth] Background service worker initialized
[OAuth] Client ID: ✓ Configured
[OAuth] Client Secret: ✓ Configured
[OAuth] Refresh Token: ✓ Configured
```

**4. Test Token Refresh:**
```javascript
// In the service worker DevTools console, run:
chrome.runtime.sendMessage(
  { type: 'GET_ACCESS_TOKEN' },
  (response) => {
    if (response.success) {
      console.log('✓ Token:', response.token.substring(0, 40) + '...');
    } else {
      console.error('✗ Error:', response.error);
    }
  }
);
```

**Expected output:**
```
[OAuth] Token expired or missing, refreshing...
[OAuth] Requesting new access token from Google...
[OAuth] ✓ New access token obtained (expires in 3599 seconds)
✓ Token: ya29.a0AQQ_BDRNtB-bzUuFFoSOxjRYPmprsKNsE...
```

**5. Verify Token is Cached:**
```javascript
// Run the same command again immediately:
chrome.runtime.sendMessage(
  { type: 'GET_ACCESS_TOKEN' },
  (response) => console.log('✓ Cached token:', response.token.substring(0, 40) + '...')
);
```

**Expected output:**
```
[OAuth] Using cached access token (expires in 3594 seconds)
✓ Cached token: ya29.a0AQQ_BDRNtB-bzUuFFoSOxjRYPmprsKNsE...
```

**6. Test with Gmail API:**
```javascript
// Get a token and make a real API call:
chrome.runtime.sendMessage({ type: 'GET_ACCESS_TOKEN' }, async (response) => {
  if (response.success) {
    const apiResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { 'Authorization': `Bearer ${response.token}` }
    });
    const data = await apiResponse.json();
    console.log('✓ Gmail API call successful! Found', data.labels?.length, 'labels');
  }
});
```

**Expected output:**
```
✓ Gmail API call successful! Found 14 labels
```

---

## Troubleshooting

### "Failed to refresh token: 401 Unauthorized"
- Check that config.js has correct credentials
- Verify refresh token hasn't been revoked
- Try regenerating refresh token

### "Extension failed to load"
- Check manifest.json syntax with: `python3 -m json.tool manifest.json`
- Verify all files exist in correct locations
- Check DevTools console for specific errors

### "Service worker not starting"
- Click "Errors" button in chrome://extensions
- Look for JavaScript syntax errors
- Verify config.js exports CONFIG correctly

---

## Phase 1 Complete ✓

At this point:
- ✅ Extension loads in Chrome
- ✅ OAuth manager successfully refreshes tokens
- ✅ Tokens are cached and reused
- ✅ Real Gmail API calls work

**Next Phase:** Injection layer (content.js and panel)
