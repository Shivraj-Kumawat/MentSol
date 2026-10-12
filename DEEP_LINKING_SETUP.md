# Deep Linking Setup for MentSol Mobile App

## What We've Configured

✅ **Capacitor Configuration** - `capacitor.config.ts` with deep link scheme `mentsol://`
✅ **Deep Link Handler** - Automatic handling of email auth links in the app
✅ **Android App Links** - Configuration for `https://` deep links on Android
✅ **iOS Universal Links** - Configuration for `https://` deep links on iOS
✅ **Well-Known Files** - Apple and Android app link verification files

## Next Steps (Required)

### 1. Update Supabase Auth Configuration

Go to your Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com
```

**Redirect URLs (Add all of these):**
```
mentsol://auth/callback
https://9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com/auth/callback
https://9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com/profile-completion
https://9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com/*
```

### 2. Update Email Templates in Supabase

Go to Supabase Dashboard → Authentication → Email Templates

For **Confirm Signup** and **Magic Link** templates, update the redirect URL to:
```
{{ .SiteURL }}/auth/callback?type=signup#access_token={{ .TokenHash }}&refresh_token={{ .Token }}&type=signup
```

For **Reset Password** template:
```
{{ .SiteURL }}/auth/callback?type=recovery#access_token={{ .TokenHash }}&refresh_token={{ .Token }}&type=recovery
```

### 3. Test Deep Linking

#### On Development:
```bash
# 1. Build the project
npm run build

# 2. Sync with Capacitor
npx cap sync

# 3. Run on device/emulator
npx cap run android
# OR
npx cap run ios
```

#### Test the deep link:
1. Send a magic link/OTP verification email
2. Open the email on your mobile device
3. Click the link - it should open directly in the MentSol app!

### 4. For Android App Links (Production)

After building your Android app, get the SHA256 fingerprint:

```bash
keytool -list -v -keystore path/to/your-keystore.jks -alias your-key-alias
```

Update `public/.well-known/assetlinks.json` with your actual SHA256 fingerprint.

### 5. For iOS Universal Links (Production)

After setting up your Apple Developer account:
1. Add Associated Domains capability in Xcode
2. Add domain: `applinks:9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com`
3. Host the `apple-app-site-association` file on your domain

## How It Works

1. **User clicks email link** → Opens as `mentsol://auth/callback?...` or `https://...`
2. **Operating system** → Routes to MentSol app (if installed)
3. **Deep link handler** → Extracts auth tokens from URL
4. **Supabase auth** → Creates session with tokens
5. **Navigation** → Redirects to appropriate page (home or profile completion)

## Troubleshooting

**Links open in browser instead of app:**
- Check that app is installed
- Verify redirect URLs in Supabase match exactly
- For Android: Verify App Links in device settings
- For iOS: Check Associated Domains in app capabilities

**App crashes on deep link:**
- Check logs: `npx cap run android --livereload` or Xcode console
- Verify tokens are being extracted correctly
- Check that auth session is being set

**Auth tokens not working:**
- Verify email template URLs include token hash
- Check that Supabase redirect URLs allow your domain
- Ensure session is being set before navigation

## Deep Link URL Schemes

The app supports two types of deep links:

1. **Custom scheme:** `mentsol://` (works immediately after install)
2. **Universal/App Links:** `https://9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovableproject.com` (requires domain verification)

Both will open the app directly instead of the browser! 🎉
