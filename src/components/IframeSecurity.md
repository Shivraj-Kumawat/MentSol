# Iframe Security Best Practices

## Why This Component Exists

The `SecureIframe` component addresses several security concerns and browser warnings:

### 1. **Supported Permissions**
Modern browsers support these iframe permissions:
- ✅ `camera` - Video capture for video calls
- ✅ `microphone` - Audio capture for video calls
- ✅ `fullscreen` - Allow fullscreen mode
- ✅ `autoplay` - Allow media autoplay
- ✅ `clipboard-read` - Read from clipboard
- ✅ `clipboard-write` - Write to clipboard

Deprecated or unsupported permissions to avoid:
- ❌ `vr` - Deprecated, use WebXR Device API instead
- ❌ `ambient-light-sensor` - Not widely supported
- ❌ `battery` - Privacy concern, removed from most browsers

### 2. **Sandbox Attribute Security**

**DANGEROUS CONFIGURATION:**
```html
<iframe sandbox="allow-scripts allow-same-origin">
```
Having both `allow-scripts` and `allow-same-origin` together effectively **disables sandbox protection** because:
- Scripts can access the parent document's origin
- Malicious scripts could perform actions as if they were on the parent page
- This negates the entire purpose of sandboxing

**SAFER CONFIGURATION:**
```html
<iframe sandbox="allow-scripts allow-forms allow-popups allow-modals">
```
This provides scripts functionality without compromising origin isolation.

### 3. **Privacy Protection**
The component uses `referrerpolicy="strict-origin-when-cross-origin"` to:
- Protect user privacy by limiting referrer information
- Only send origin when navigating to same-origin destinations
- Strip sensitive path and query parameters for cross-origin requests

### 4. **URL Validation**
The component validates iframe sources to prevent:
- `javascript:` protocol attacks
- `data:` URI XSS attacks
- File system access attempts

## Usage Examples

### Basic Usage
```tsx
import { SecureIframe } from '@/components/SecureIframe';

<SecureIframe 
  src="https://example.com/embed"
  title="Embedded Content"
  className="w-full h-96"
/>
```

### Video Call Usage
```tsx
import { VideoCallIframe } from '@/components/SecureIframe';

<VideoCallIframe 
  src="https://meet.example.com/room/123"
  title="Video Conference"
  onLoad={() => console.log('Call loaded')}
  onError={(err) => console.error('Call error:', err)}
/>
```

### With All Permissions
```tsx
<SecureIframe 
  src="https://example.com/video"
  title="Video Player"
  allowCamera={true}
  allowMicrophone={true}
  allowFullscreen={true}
  allowAutoplay={true}
  allowClipboardRead={true}
  sandbox="allow-scripts allow-forms"
  referrerPolicy="strict-origin-when-cross-origin"
/>
```

### Custom Sandbox
```tsx
<SecureIframe 
  src="https://trusted-site.com"
  title="Trusted Content"
  sandbox="allow-scripts allow-forms allow-same-origin"
  // Note: Use allow-same-origin ONLY for fully trusted sources
/>
```

## Security Checklist

- ✅ Only use supported iframe permissions
- ✅ Avoid `allow-scripts` + `allow-same-origin` unless source is fully trusted
- ✅ Use `strict-origin-when-cross-origin` referrer policy
- ✅ Validate iframe source URLs
- ✅ Use HTTPS sources when possible
- ✅ Implement CSP (Content Security Policy) headers
- ✅ Add loading and error states
- ✅ Use lazy loading for performance
- ✅ Provide proper ARIA labels and titles
- ✅ Minimize granted permissions (principle of least privilege)

## References

- [MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
- [MDN: Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [OWASP: iframe Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#iframes)
