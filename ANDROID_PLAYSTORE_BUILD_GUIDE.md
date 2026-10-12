# Android Play Store Build Guide

This guide helps you build a signed Android App Bundle (.aab) for Google Play Console.

## Prerequisites

- Node.js 18+
- Android Studio (latest)
- Your **existing release keystore** (DO NOT create a new one)
- JDK 17+

## Step 1: Verify Your Keystore

Before building, confirm your keystore SHA1 matches what Play Console expects:

```bash
keytool -list -v -keystore /path/to/your_keystore.jks
```

Compare the SHA1 fingerprint with Play Console → Setup → App integrity.

**If SHA1 doesn't match:** You cannot upload with a different key. If Play App Signing is enabled, request an upload key reset in Play Console.

## Step 2: Clone and Setup

```bash
# Clone from GitHub
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install

# Build web assets
npm run build

# Sync to Android
npx cap sync android
```

## Step 3: Configure Keystore Properties

Create `android/keystore.properties` (never commit this file):

```properties
storeFile=/absolute/path/to/your_keystore.jks
storePassword=your_store_password
keyAlias=your_key_alias
keyPassword=your_key_password
```

## Step 4: Update build.gradle

Edit `android/app/build.gradle`:

### A) Load keystore properties (add near the top):

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

### B) Add signing config (inside `android {}` block):

```groovy
signingConfigs {
    release {
        storeFile file(keystoreProperties['storeFile'] ?: "")
        storePassword keystoreProperties['storePassword'] ?: ""
        keyAlias keystoreProperties['keyAlias'] ?: ""
        keyPassword keystoreProperties['keyPassword'] ?: ""
    }
}
```

### C) Use signing config in buildTypes:

```groovy
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### D) Update version and SDK (inside `android { defaultConfig {} }`):

```groovy
defaultConfig {
    applicationId "app.lovable.9c6d35476c0641538b16b9dd6cd14714"
    minSdkVersion 24
    targetSdkVersion 36
    versionCode 10001  // INCREMENT this for each upload
    versionName "1.0"
    // ... rest of config
}
```

Also ensure `compileSdkVersion 36` at the top of the android block.

## Step 5: Production Build Configuration

**IMPORTANT:** For production builds, disable the Lovable preview hot-reload server so the app uses bundled web assets.

In `capacitor.config.ts`, set:

```ts
const isDevelopment = false;
```

Then rebuild and sync:

```bash
npm run build
npx cap sync android
```

## Step 6: Clean and Build Release AAB

```bash
cd android

# Clean previous builds
./gradlew clean
rm -rf app/build build .gradle

# Build release bundle
./gradlew :app:bundleRelease
```

Output location:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Step 7: Verify AAB Signature Before Upload

```bash
# Extract and verify certificate
unzip -p app/build/outputs/bundle/release/app-release.aab "META-INF/*.RSA" | keytool -printcert
```

Confirm the SHA1 matches Play Console's expected certificate.

## Step 8: Upload to Play Console

1. Open Play Console → your app
2. Go to Release → Testing (Internal/Closed) or Production
3. Create new release
4. Upload `app-release.aab`
5. Add release notes
6. Review and roll out

## Troubleshooting

### "You uploaded an APK or Android App Bundle that was signed with a different certificate"

- You're using a different keystore than the original upload
- Verify keystore SHA1 matches Play Console expectations
- If Play App Signing is enabled, request upload key reset

### "Version code already used"

- Increment `versionCode` in build.gradle
- Each upload must have a unique, higher versionCode

### "Target SDK version too low"

- Update `targetSdkVersion` to 34 or higher (currently recommend 36)
- Update `compileSdkVersion` to match

## Version Code History

| Version Code | Version Name | Date | Notes |
|--------------|--------------|------|-------|
| 10001 | 1.0 | 2024-12-28 | Fixed signing configuration |

## Security Reminders

- ⚠️ NEVER commit `keystore.properties` or your `.jks` file
- ⚠️ Keep keystore backups in a secure location
- ⚠️ Use different passwords for store and key if possible
- ⚠️ Enable Play App Signing for additional security
