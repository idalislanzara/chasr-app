#!/bin/bash
# Chasr full-stack launcher — starts backend + tunnel persistently via tmux
cd /root/Documents/projects/chasr

# Kill old processes
pkill -f "node index.cjs" 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 1

# Start backend server (persistent)
tmux kill-session -t chasr 2>/dev/null
tmux kill-session -t tunnel 2>/dev/null
tmux new-session -d -s chasr "cd /root/Documents/projects/chasr/server && node index.cjs 2>&1 | tee /tmp/chasr-server.log"
sleep 3

# Start cloudflare tunnel (persistent)
tmux new-session -d -s tunnel "cloudflared tunnel --url http://localhost:3001 2>&1 | tee /tmp/chasr-tunnel.log"
sleep 10

URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' /tmp/chasr-tunnel.log | head -1)
echo ""
echo "=========================================="
echo "  CHASR IS LIVE:  $URL"
echo "=========================================="
