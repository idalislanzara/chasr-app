#!/usr/bin/env bash
# Point the app at the permanent Render backend and push to GitHub Pages.
# Usage: ./deploy-render.sh https://YOUR-APP.onrender.com
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: ./deploy-render.sh https://YOUR-APP.onrender.com"
  exit 1
fi

RENDER_URL="${1%/}"
cd "$(dirname "$0")"

echo "==> Building frontend -> ${RENDER_URL}"
VITE_API_URL="$RENDER_URL" npm run build

echo "==> Syncing dist -> docs"
rm -rf docs && mkdir -p docs
cp dist/index.html dist/landing.html dist/manifest.json dist/favicon.svg dist/sw.js dist/serve.json dist/og-image.png dist/icons.svg docs/
cp dist/icon-192.png dist/icon-512.png dist/icon-maskable-512.png docs/
cp -r dist/assets docs/

cat > docs/404.html <<'HTML'
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Chasr Dating</title>
<script>
var p=1,l=window.location;
l.replace(l.protocol+'//'+l.hostname+(l.port?':'+l.port:'')+
l.pathname.split('/').slice(0,1+p).join('/')+'/?/'+
l.pathname.slice(1).split('/').slice(p).join('/').replace(/&/g,'~')+
(l.search?'&'+l.search.slice(1).replace(/&/g,'~'):'')+l.hash);
</script></head><body></body></html>
HTML

echo "==> Committing + pushing"
git add -A
git commit -q -m "Point frontend at production backend: ${RENDER_URL}"
git push origin main -q

echo "==> DONE - GitHub Pages will update in ~1 minute"
