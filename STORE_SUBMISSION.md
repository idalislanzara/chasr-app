# Chasr Dating — Play Store Submission Checklist

**You are the only person who can do the legal steps.** These require your real identity,
your payment card, and your agreement to Google's legal terms. Everything app-side is done.

---

## 0. What is already done (verified)

- Signed release build (`app-release.aab`) — the file Play Console accepts. Version 1.0.0 (versionCode 1).
- Server-side 18+ enforcement — under-18 accounts cannot be created or saved.
- Account deletion (Settings → Delete account) — required by Play policy.
- In-app **Report** (profile + chat) with reasons including "Underage person".
- In-app **Block** (profile + chat); blocked users can't message you or appear in results.
- Exact GPS coordinates are **never** shown to other users — only distance (e.g., "0.4 km").
- Live privacy policy + terms pages (linked below).
- No fake/AI profiles. Real users only.

---

## 1. Create your Google Play Developer account (you, ~1 hour, $25)

1. Go to https://play.google.com/console and sign in with a Google account (use one you won't lose).
2. Pay the **one-time $25 USD** registration fee.
3. Fill in your real developer name, contact email, and address. Google verifies this.
4. Agree to the Developer Distribution Agreement and Developer Program Policies (read them).

> If the $25 is the blocker: Play's fee is one-time, not per-app. There is no free workaround —
> accounts with mismatched or fake details get suspended and you lose the money.

---

## 2. Register the domain (optional but recommended, ~$10–15/yr)

- `chasr.com` is owned by a domain-holding company until 2030 — not realistic.
- **`chasrdating.com` is available** and is my recommendation.
- Buy it at any registrar (Namecheap, Cloudflare, Google Domains replacement, etc.).
- Tell me once it's bought and I'll point the app site at it.

---

## 3. Create the app entry in Play Console

1. Play Console → **Create app** → name **Chasr Dating**, language English (US).
2. Complete the "App content" page:
   - **Privacy policy URL:** `https://chasr-app-1.onrender.com/privacy`
   - **Ads:** No
   - **Content rating:** Complete the questionnaire honestly (it will land on **18+** because the app is a dating app with user interaction and user-generated content).
   - **Target audience:** 18+
   - **Dating apps:** Tick "yes — this app offers dating services"; declare the age gate (the app requires users to confirm they are 18+ and enter their age at signup).
   - **User-generated content:** "Yes" — declare in-app reporting and blocking (both are implemented).
   - **News:** No
3. **Data safety form** (be truthful — this is a legal declaration):
   - Location (approximate + precise): collected, processed on device/server, shared only to show distance to other users.
   - Personal info: name, email, photos, messages — used for profiles and matching.
   - Deletion: yes, in-app account deletion exists.
   - Encrypted in transit: yes (HTTPS).
4. **Upload the AAB:** Production → Create release → upload `app-release.aab`.
5. **Store listing:** copy the text from `STORE_LISTING.md`.
6. **App access:** the app works without login for browsing? No — requires account. Declare accordingly.
7. **Advertising:** No.

---

## 4. Test before going public (recommended, avoids humiliation)

Play Console → **Testing → Closed testing** → create a track, add your friends' Google email
addresses, upload the AAB. Friends install via an invite link. This is the legal, private way
for them to try it before the store listing is public.

---

## 5. Safety rules for going live (non-negotiable)

- **No fake profiles, ever.** Google's impersonation/deceptive-behavior policies ban them, and
  they caused the underage-content problem before. Real users only.
- Respond to reports within 24–48 hours and remove accounts that are underage or illegal —
  keep a record of what you did.
- Never share users' exact locations, email addresses, or photos with third parties.
- If you ever receive a legal request (police/court) or a DMCA notice, don't ignore it —
  ask me and I'll help you respond.

---

## 6. Keep these secrets safe

- `android/chasr-release.keystore` + the password in `android/keystore.pass` — the app's
  permanent identity. **Back them up to a private USB/drive.** If lost, the app can never be updated.
- Never paste the keystore, passwords, or GitHub tokens into chats. The GitHub token you shared
  earlier should be revoked after we finish.
