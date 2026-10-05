#!/bin/sh
# Development entrypoint: install deps into the node_modules volumes once, then run the API
# (restarting on changes) and the Vite dev server with hot module reload.
set -e
cd /app

if [ ! -f node_modules/.noore-installed ] || [ package-lock.json -nt node_modules/.noore-installed ]; then
  echo "✦ Installing dependencies (first run or lockfile changed) — this takes a couple of minutes…"
  npm ci --no-audit --no-fund
  touch node_modules/.noore-installed
fi

echo "✦ Starting NOORÉ API (restarts automatically when server files change)…"
# -L = legacy polling watch, required for bind mounts from Windows
npx -y nodemon@3 -L --watch server/src --watch shared --ext js,json --exec "node server/src/index.js" &

echo "✦ Starting Vite dev server → http://localhost:5173"
cd /app/client
exec /app/node_modules/.bin/vite --host 0.0.0.0 --port 5173 --strictPort
