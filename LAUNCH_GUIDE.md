# Chasr Dating — Go Live Guide (Production)

## Current Live Demo
- App (shared database): `https://wishlist-flame-treasure-receptor.trycloudflare.com`
- Backup frontend: `https://idalislanzara.github.io/chasr-app/`

> ⚠️ The demo tunnel runs from a local machine. For the permanent launch, deploy to Render (below) — then the app never depends on anyone's laptop.

---

## Step 1 — Deploy the backend (10 minutes, ~$7/mo, required for launch)

1. Go to `https://render.com` → **Sign up with GitHub** (use the same GitHub account that owns `idalislanzara/chasr-app`)
2. After login: **New +** (top right) → **Web Service**
3. Connect the repository `chasr-app`
4. Render auto-detects `render.yaml` — just click **Create Web Service**
5. Wait ~3 minutes for the build. When the URL shows green (Healthy), the backend is live:
   - Your permanent URL will be like `https://chasr.onrender.com`
6. **Update the frontend to use it** (one command, run by your developer):
   ```bash
   cd /root/Documents/projects/chasr
   VITE_API_URL=https://YOUR-APP.onrender.com npm run build
   # then sync dist -> docs and push to GitHub Pages
   ```

That's it. From then on:
- **One shared database** on a persistent disk — everyone sees everyone
- **Stable HTTPS URL** — no more changing links
- **Auto-restarts** on crash, **never** depends on this machine
- Real-time chat/typing works through the same URL

### Why paid ($7/mo) and not free?
Free hosting tiers wipe the database whenever the server restarts — that would be the same deadend as before. Render Starter keeps a permanent disk (1 GB is plenty for launch). You said you'd pay for reliability — this is that.

---

## Step 2 — Keep GitHub Pages pointing at the backend
Once Render is live, the GitHub Pages URL becomes a second door into the same app (via the Render URL). Your developer runs the single command above, pushes, done.

---

## Step 3 — App Store launch (needs your accounts)

### Google Play ($25 one-time)
1. Create a Google Play Developer account at `play.google.com/console`
2. Your developer signs the Android build (`android/` folder exists) and uploads via Play Console
3. Complete the data-safety form + content rating (18+)

### Apple App Store ($99/year)
1. Create an Apple Developer account at `developer.apple.com`
2. Requires a Mac with Xcode — your developer signs the iOS build (`ios/` folder exists)
3. Submit via App Store Connect (18+ rating, privacy policy)

### Before submitting
- Privacy policy: `PRIVACY_POLICY.md` (needs your real contact email)
- Store listing text: `STORE_LISTING.md`
- Screenshots of the live app

---

## What "fully operational" means right now
| Feature | Status |
|---|---|
| Age gate (18+ DOB + terms) | ✅ live |
| Register / login (hashed passwords) | ✅ live |
| Profile creation + photos | ✅ live |
| Browse + filters + search | ✅ live |
| Like / favorite + match detection | ✅ live |
| Chat with unread badges + typing | ✅ live |
| Nearby (GPS, distance) | ✅ live |
| Right Now (online users) | ✅ live |
| Store (premium plans) | ✅ live |
| Shared database across all users | ✅ on Render after Step 1 |
| App stores | 🔒 needs developer accounts (Step 3) |

---

## If something breaks (before Render deploy)
The watchdog on this machine restarts the server and tunnel automatically and re-syncs GitHub Pages when the tunnel URL changes. Check status:
```bash
tmux ls            # should list: chasr, tunnel, watchdog
bash start.sh      # full manual restart
```
