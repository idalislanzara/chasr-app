# Chasr Launch Guide

## Phase 1: Get the Backend Live (5 minutes)

1. Go to https://render.com → Sign up (free)
2. Click "New +" → "Web Service"
3. Connect GitHub repo: `idalislanzara/chasr-app`
4. Settings:
   - Name: `chasr`
   - Runtime: `Node`
   - Build: `npm install && npm run build`
   - Start: `node server/index.cjs`
5. Add env var: `JWT_SECRET` = `chasr_secret_2026`
6. Click "Create Web Service"
7. You get: `https://chasr-xxxx.onrender.com`

## Phase 2: Get on the Play Store

### Prerequisites
- Google Play Developer Account: https://play.google.com/console ($25 one-time)
- Android Studio installed

### Build the Android APK
```bash
cd chasr
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

### Store Listing
- **Title:** Chasr — Dating for Trans
- **Short description:** Find your people. Chasr is a dating app built for the trans community.
- **Category:** Social
- **Content rating:** Mature 17+
- **Privacy policy:** Already in PRIVACY_POLICY.md

### Screenshots needed (at least 4):
1. Login/Register screen
2. Browse grid
3. Profile view
4. Chat/inbox

## Phase 3: Marketing & Growth

### Free channels
1. **Reddit** — Post in r/trans, r/asktransgender, r/lgbt, r/grindr
   - Title: "I built Chasr — a dating app for the trans community"
   - Don't spam — share your story of why you built it
2. **Twitter/X** — Post with hashtags: #trans #dating #LGBTQ #app
3. **TikTok** — Short video showing the app, "POV: you wanted a dating app that gets you"
4. **Discord** — Join trans servers and share (ask permission first)
5. **Instagram** — Post screenshots with trans-friendly hashtags
6. **Tumblr** — Trans community is huge there
7. **Bluesky** — Growing LGBTQ+ community

### Content ideas
- "Built this because Grindr wasn't made for us"
- "Finally a dating app where you can be yourself"
- User testimonials (once you have real users)
- "Day 1 of building a trans dating app" series on TikTok

### Partnerships
- Reach out to trans influencers/content creators
- Offer free premium for early adopters
- Partner with LGBTQ+ organizations

## Phase 4: iOS (later)

- Need Apple Developer account ($99/year)
- Use `npx cap open ios` to open in Xcode
- Submit to App Store Connect
