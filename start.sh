#!/bin/bash
cd /root/Documents/projects/chasr

# Kill old processes
pkill -f "node server/index.js" 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 1

# Start server
nohup node server/index.js > /tmp/chasr-server.log 2>&1 &
echo "Server PID: $!"
sleep 3

# Start tunnel
nohup cloudflared tunnel --url http://localhost:3001 > /tmp/cloudflared.log 2>&1 &
echo "Tunnel PID: $!"
sleep 8

# Get URL
URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' /tmp/cloudflared.log | tail -1)
echo ""
echo "================================"
echo "  CHASR IS LIVE:"
echo "  $URL"
echo "================================"
