# 🚀 Chasr — Deployment Guide

## Quick Reference

```bash
npm run build          # Build web assets
npm run cap:sync       # Sync to native projects
npm run cap:android    # Open in Android Studio
npm run cap:ios        # Open in Xcode
```

---

## Step 1: Build the Web App

```bash
cd chasr
npm install
npm run build
```

This creates the `dist/` folder with optimized production assets.

---

## Step 2: Sync to Native Platforms

```bash
npx cap sync
```

This copies web assets into both `android/` and `ios/` projects.

---

## Step 3: Android — Google Play Store

### 3.1 Prerequisites
- [Google Play Developer Account](https://play.google.com/console) ($25 one-time fee)
- [Android Studio](https://developer.android.com/studio) installed
- Java JDK 17+

### 3.2 Open in Android Studio
```bash
npx cap open android
```
Or open the `android/` folder directly in Android Studio.

### 3.3 Generate Release Keystore
```bash
keytool -genkey -v -keystore chasr-release.keystore \
  -alias chasr -keyalg RSA -keysize 2048 -validity 10000
```
⚠️ **Store this file safely.** If you lose it, you can't update your app.

### 3.4 Configure Signing
Edit `android/app/build.gradle` and uncomment the signing config:
```groovy
signingConfigs {
    release {
        storeFile file('../chasr-release.keystore')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'chasr'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

### 3.5 Build Release AAB
In Android Studio: **Build → Generate Signed Bundle / APK**
- Choose **Android App Bundle**
- Select your keystore
- Build release variant

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 3.6 Upload to Play Console
1. Go to [Play Console](https://play.google.com/console)
2. Create app → Name: "Chasr"
3. Go to **Production** → **Create new release**
4. Upload the `.aab` file
5. Fill in store listing (see `STORE_LISTING.md`)
6. Add screenshots (required: phone, 7" tablet, 10" tablet)
7. Set content rating questionnaire
8. Add privacy policy URL
9. Submit for review (1-7 days)

### 3.7 Required Android Screenshots
| Device | Resolution |
|--------|-----------|
| Phone (min 2) | 1080×1920 or 1440×2560 |
| 7" Tablet | 1024×1600 |
| 10" Tablet | 1200×1920 |

---

## Step 4: iOS — App Store

### 4.1 Prerequisites
- [Apple Developer Account](https://developer.apple.com/) ($99/year)
- Mac with [Xcode](https://developer.apple.com/xcode/) installed
- Apple Silicon or Intel Mac

### 4.2 Open in Xcode
```bash
npx cap open ios
```
Or open `ios/App/App.xcworkspace` in Xcode.

### 4.3 Configure Signing
1. Select the **App** project in Xcode navigator
2. Under **Signing & Capabilities**:
   - Select your **Team** (Apple Developer account)
   - Change **Bundle Identifier** to something unique (e.g., `com.yourname.chasr`)
   - Enable **Automatically manage signing**

### 4.4 Set Version Number
In Xcode: **App** → **General** → **Identity**
- **Version:** 1.0.0
- **Build:** 1

### 4.5 Archive & Upload
1. Select **Any iOS Device** as build target
2. **Product → Archive**
3. After archive completes: **Distribute App → App Store Connect**
4. Upload

### 4.6 App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps → + → New App**
3. Fill in:
   - **Name:** Chasr
   - **Primary Language:** English
   - **Bundle ID:** (match your Xcode bundle ID)
   - **SKU:** chasr-ios-001
   - **User Access:** Full Access

### 4.7 App Privacy Details (Required)
In App Store Connect → **App Privacy**:

| Data Type | Used For | Collected |
|-----------|----------|-----------|
| Location | App Functionality | Yes |
| Name | App Functionality | Yes |
| Email | App Functionality | Yes |
| Photos | App Functionality | Yes |
| User Content (Messages) | App Functionality | Yes |
| Identifiers (Device ID) | Analytics | Yes |
| Usage Data | Analytics | Yes |

### 4.8 Required iOS Screenshots
| Device | Size |
|--------|------|
| iPhone 6.7" (required) | 1290×2796 |
| iPhone 6.5" (required) | 1242×2688 |
| iPhone 5.5" (required) | 1242×2208 |
| iPad Pro 12.9" (optional) | 2048×2732 |

---

## Step 5: Post-Launch Checklist

### Both Stores
- [ ] Privacy policy hosted and linked
- [ ] Screenshots uploaded for all required devices
- [ ] Store descriptions filled in (see `STORE_LISTING.md`)
- [ ] Content rating completed
- [ ] Pricing set (Free with in-app purchases)
- [ ] Support email configured

### Android Specific
- [ ] Keystore backed up securely
- [ ] google-services.json added (for push notifications)
- [ ] ProGuard rules tested
- [ ] Target SDK 34+ (required by Play Store)

### iOS Specific
- [ ] Provisioning profiles valid
- [ ] App Transport Security configured ✓
- [ ] Privacy permission strings added ✓
- [ ] Push notification entitlement added (if using)
- [ ] App Tracking Transparency prompt (if using analytics)

---

## Step 6: PWA (Progressive Web App)

The app is also installable as a PWA from any browser:

```bash
npm run build
# Deploy dist/ to any static host
```

### Install Instructions
- **Chrome/Edge:** Click "Install" in address bar
- **Safari iOS:** Share → "Add to Home Screen"
- **Firefox:** "Install" option in menu

---

## Common Issues

### Android
| Issue | Fix |
|-------|-----|
| "SDK not found" | Install Android Studio, set ANDROID_HOME |
| "Gradle build failed" | Run `cd android && ./gradlew clean` |
| "Keystore error" | Verify passwords in build.gradle |

### iOS
| Issue | Fix |
|-------|-----|
| "No signing certificate" | Join Apple Developer Program |
| "Archive failed" | Select "Any iOS Device" target |
| "Pods error" | Run `cd ios/App && pod install` |

---

## Environment Variables

For push notifications and analytics, create:

**Android:** `android/app/google-services.json`
**iOS:** `ios/App/App/GoogleService-Info.plist`

Get these from Firebase Console → Project Settings → Add app.

---

*Made with 💜 for the trans community*
