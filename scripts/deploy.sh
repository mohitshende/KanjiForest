#!/bin/bash
# Build and deploy KanjiForest to Vercel
set -e

cd "$(dirname "$0")/.."

echo "=== Exporting web build ==="
npx expo export --platform web --clear

echo "=== Fixing fonts for Vercel ==="
# Vercel ignores node_modules paths - copy fonts to assets/fonts/
mkdir -p dist/assets/fonts
cp dist/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/*.ttf dist/assets/fonts/ 2>/dev/null || true

# Rewrite JS bundle to use new font paths
JSFILE=$(find dist/_expo/static/js/web -name "entry-*.js" 2>/dev/null | head -1)
if [ -n "$JSFILE" ]; then
  sed -i 's|assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/|assets/fonts/|g' "$JSFILE"
fi

# Inject @font-face CSS into all HTML files
FONT_CSS='<style>@font-face{font-family:"Ionicons";src:url("/assets/fonts/Ionicons.ttf") format("truetype");font-display:swap;}</style>'
find dist -name "*.html" -exec sed -i "s|</head>|${FONT_CSS}</head>|" {} \;

# Copy Ionicons without hash for CSS @font-face
cp dist/assets/fonts/Ionicons.*.ttf dist/assets/fonts/Ionicons.ttf 2>/dev/null || true

# Copy vercel.json for SPA routing
cp vercel.json dist/vercel.json

echo "=== Deploying to Vercel ==="
cd dist
npx vercel --prod --yes

echo "=== Done ==="
