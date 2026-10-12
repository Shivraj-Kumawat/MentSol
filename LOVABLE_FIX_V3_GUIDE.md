# Lovable Fix V3.0 - Security Enhancement Guide

## Overview

The lovable-fix-v3.0 minified script provides comprehensive page hardening to protect against token leakage, iframe security vulnerabilities, and unsupported feature warnings. It's deployed inline in the `<head>` section of `index.html`.

## Key Features

### 1. Unload Event Shim
Automatically replaces deprecated `unload` event listeners with modern alternatives:
- **Pagehide Event**: Primary replacement for unload (better browser support)
- **Visibilitychange Event**: Fallback for additional coverage when document becomes hidden
- **WeakMap Tracking**: Maintains handler references for proper removeEventListener support
- **Zero Breaking Changes**: Transparently handles all addEventListener/removeEventListener calls
- **Telemetry Helper**: `window.sendOnHide(url, data)` for safe analytics using sendBeacon API

This eliminates browser console warnings about deprecated unload events while maintaining backward compatibility with legacy code.

#### Using sendOnHide for Analytics

```javascript
// Send analytics safely when user leaves page
window.addEventListener('pagehide', function() {
  window.sendOnHide('/api/analytics', {
    event: 'page_exit',
    timestamp: Date.now(),
    sessionDuration: performance.now()
  });
});
```

The helper automatically uses `navigator.sendBeacon()` (preferred) with `fetch` keepalive as fallback, ensuring data delivery even when the page is unloading.

### 2. Extended Token URL Scrubbing
Automatically removes sensitive tokens from:
- Browser address bar on page load
- Iframe `src` attributes
- All outgoing HTTP requests (fetch, XHR, window.open)
- Form actions and anchor links
- **NEW:** Hash fragments (e.g., `#token=SECRET`)

**Supported token parameters:**
- `__lovable_token`
- `token`
- `access_token`
- `auth`
- `jwt`
- `id_token`

### 3. Iframe Sanitization
- **Sandbox Protection**: Prevents dangerous sandbox combinations (removes `allow-same-origin` when `allow-scripts` is present)
- **Bad Feature Removal**: Automatically removes unsupported iframe features from `allow` attribute:
  - `vr` - Virtual Reality access (deprecated/unsupported)
  - `ambient-light-sensor` - Ambient light sensor access (deprecated)
  - `battery` - Battery status API (deprecated)
- **Meta Tag Cleanup**: Removes meta permission policy tags containing bad features
- Applies to existing iframes and monitors for dynamically added ones
- Supports trusted iframe opt-out via ID or `data-lovable-id` attribute

### 4. Outgoing Request Protection
Patches the following browser APIs to scrub tokens:
- `window.fetch()` - Intercepts and sanitizes fetch requests
- `XMLHttpRequest.open()` - Scrubs XHR requests
- `window.open()` - Sanitizes popup/new window URLs

### 5. DOM Element Protection
- Automatically scrubs tokens from anchor `href` attributes
- Sanitizes form `action` attributes
- Real-time monitoring via MutationObserver

## Deployment Best Practices

### ✅ Current Implementation (Correct)
The script is deployed **inline in `<head>`** before any third-party embeds or scripts. This ensures maximum protection.

```html
<head>
  <!-- ... meta tags ... -->
  
  <!-- Lovable Fix V3.0 runs FIRST -->
  <script>
    /* lovable-fix-v3.min.js */
    (function(){ /* protection code */ })();
  </script>
  
  <!-- Other scripts load after protection is active -->
</head>
```

## Trusted Iframe Configuration

### Method 1: Using ID attribute
**Problem:** Query string tokens leak through:
- Browser history
- Server logs
- Referer headers
- Bookmarks
- Shared links

**Solution:** Use HttpOnly Secure cookies or server-side sessions instead:

```javascript
// Server-side (example)
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});
```


### Method 1: Using ID attribute
```html
<script>
  window.LOVABLE_FIX_TRUSTED_IFRAME_IDS = ['trusted-payment-iframe'];
</script>

<iframe id="trusted-payment-iframe" src="..." sandbox="allow-scripts allow-same-origin"></iframe>
```

### Method 2: Using data-lovable-id attribute
```html
<script>
  window.LOVABLE_FIX_TRUSTED_IFRAME_IDS = ['stripe-checkout'];
</script>

<iframe data-lovable-id="stripe-checkout" src="..." sandbox="allow-scripts allow-same-origin"></iframe>
```

**Warning:** Only use for truly trusted third-party services. The `allow-scripts` + `allow-same-origin` combination allows the iframe to access your page's origin.

## Testing & Verification

### Test in Incognito Mode
Always test token scrubbing in a fresh browser session:

```bash
# 1. Open incognito/private window
# 2. Navigate to: https://yourapp.com/?__lovable_token=SECRET123
# 3. Check address bar - token should be removed
# 4. Check console for: [fix] removed token(s) from URL
```

### Verify Iframe Protection

**Open DevTools Console:**

```javascript
// Check all iframes after page load
document.querySelectorAll('iframe').forEach((iframe, i) => {
  console.log(`Iframe ${i}:`, {
    src: iframe.src,
    allow: iframe.getAttribute('allow'),
    sandbox: iframe.getAttribute('sandbox')
  });
});

// Should not see:
// - __lovable_token in any src
// - vr, battery, ambient-light-sensor in allow attributes
// - allow-scripts + allow-same-origin together (unless opted out)
```

### Test Outgoing Request Scrubbing

**Network Tab Test:**

```javascript
// Test fetch scrubbing
fetch('https://api.example.com/data?__lovable_token=SECRET')
  .then(() => console.log('Check Network tab - token should be removed'));

// Check Network tab in DevTools
// Request URL should NOT contain __lovable_token
```

### Console Verification

Look for these success messages:

```
[fix] removed token(s) from URL
[fix] patched fetch to scrub token params (best-effort)
[fix] patched XHR.open to scrub token params (best-effort)
[fix] patched window.open to scrub token params
[fix] lovable-fix-v2 active
```


## Programmatic API

The script exposes `window.LOVABLE_FIX` for manual control:

```javascript
// Manually strip tokens from any URL
const cleanUrl = window.LOVABLE_FIX.stripTokenFromUrl('https://example.com?token=SECRET');

// Re-scrub all elements (anchors, forms, iframes)
window.LOVABLE_FIX.scrubAll();

// Remove bad features from iframe allow attribute
const cleanAllow = window.LOVABLE_FIX.removeBadAllowFeatures('camera; vr; microphone');

// Check version
console.log(window.LOVABLE_FIX.version); // "3.0"
```

## Debug Settings Integration

Users can control these features via the Debug Settings page at `/debug-settings`:

- Toggle token scrubbing on/off
- Toggle iframe sanitization on/off
- View real-time protection status
- Clear all settings and reload

Settings are stored in `localStorage` and require a page reload to take effect.

## Common Issues & Solutions

### Issue: Legitimate iframe is broken
**Solution:** Add its ID to the trusted list:
```javascript
window.LOVABLE_FIX_TRUSTED_IFRAME_IDS = ['working-iframe-id'];
```

### Issue: Token still appears in logs
**Problem:** Server-side logging happens before client-side scrubbing
**Solution:** Move authentication to HttpOnly cookies

### Issue: Third-party embed not loading
**Check:**
1. Is the embed's src being blocked by CSP?
2. Does it require specific `allow` features?
3. Is it in the trusted iframe list if it needs `allow-same-origin`?

### Issue: Forms submitting with tokens
**Verification:**
```javascript
// Check form action before submission
document.querySelector('form').addEventListener('submit', (e) => {
  console.log('Form action:', e.target.action);
  // Should not contain __lovable_token
});
```

## Performance Impact

- **Minimal overhead:** Runs once on load, then only on DOM changes
- **MutationObserver:** Efficient, browser-native API
- **Request patching:** Negligible latency (<1ms per request)

## Security Considerations

### What This Protects Against
✅ Token leakage via browser history  
✅ Token leakage via Referer headers  
✅ Iframe sandbox escapes  
✅ Unsupported feature warnings  
✅ Deprecated unload event warnings  
✅ Accidental token sharing in links

### What This Does NOT Protect Against
❌ XSS attacks (use CSP and proper escaping)  
❌ CSRF attacks (use CSRF tokens and SameSite cookies)  
❌ Man-in-the-middle attacks (use HTTPS)  
❌ Server-side token leakage (use proper server logging)

## Compliance & Privacy

This script helps with:
- **GDPR:** Reduces token exposure in browser history
- **PCI DSS:** Helps prevent sensitive data in URLs
- **OWASP Top 10:** Mitigates A01:2021 - Broken Access Control

## Updates & Maintenance

Current version: **3.0** (minified)

**What's New in V3.0:**
- **Unload Event Shim**: Automatically replaces deprecated `unload` events with `pagehide`/`visibilitychange`
- **Bad Feature Removal**: Automatically strips `vr`, `ambient-light-sensor`, and `battery` from iframe `allow` attributes
- **Meta Tag Cleanup**: Removes permission policy meta tags containing deprecated features
- **API Enhancement**: New `removeBadAllowFeatures()` function for manual feature filtering
- **Improved iframe scrubbing**: Centralized `scrubIframe()` function handles all iframe sanitization
- **Better error handling**: Null checks for browser API availability before patching
- **Console noise reduction**: Eliminates browser warnings about unsupported iframe features and deprecated APIs

**Migration from V2.1 to V3.0:**
- No breaking changes - V3 is fully backward compatible
- All V2.1 APIs remain available
- New `removeBadAllowFeatures` API is optional to use
- Existing trusted iframe configurations work unchanged

To update:
1. Replace the inline script in `index.html`
2. Test thoroughly in staging
3. Verify all integrations still work
4. Deploy to production

## Support

For issues or questions:
- Check browser console for `[lovable-fix]` messages
- Use `/debug-settings` page to toggle features (Note: Some features may not be configurable with minified version)
- Use `/security-tests` page to run automated validation
- Review Network tab to verify token scrubbing
- Inspect iframes with `document.querySelectorAll('iframe')`
- Access API: `window.LOVABLE_FIX.scrubAll()`

---

**Last Updated:** 2025-11-23  
**Version:** 3.0 (minified)  
**Status:** Production-ready
