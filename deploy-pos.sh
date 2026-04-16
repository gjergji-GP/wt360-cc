#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Find the latest app_b64 file in this folder
FILE=$(ls app_b64_*.txt 2>/dev/null | sort -V | tail -1)

if [ -z "$FILE" ]; then
  echo "❌  No app_b64_*.txt file found in $(pwd)"
  exit 1
fi

echo "📦  Found: $FILE"
echo "🔓  Decoding to src/App.jsx..."
node -e "require('fs').writeFileSync('src/App.jsx', Buffer.from(require('fs').readFileSync('$FILE','utf8'), 'base64'))"

echo "✅  Decode complete — $(wc -l < src/App.jsx) lines"
echo "🔨  Building..."
npm run build

echo "🚀  Deploying..."
vercel --prod

echo "✅  Done."
