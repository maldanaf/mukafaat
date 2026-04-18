#!/bin/bash
# Patch React DOM to prevent removeChild crash on null parentNode
DEV_FILE="node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js"
PROD_FILE="node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js"

if [ -f "$DEV_FILE" ]; then
  sed -i '' 's/deletedFiber.parentNode.removeChild(deletedFiber)/deletedFiber.parentNode \&\& deletedFiber.parentNode.removeChild(deletedFiber)/g' "$DEV_FILE" 2>/dev/null || \
  sed -i 's/deletedFiber.parentNode.removeChild(deletedFiber)/deletedFiber.parentNode \&\& deletedFiber.parentNode.removeChild(deletedFiber)/g' "$DEV_FILE" 2>/dev/null
  echo "Patched React DOM (dev)"
fi

if [ -f "$PROD_FILE" ]; then
  sed -i '' 's/\.parentNode\.removeChild(/.parentNode\&\&\0/g' "$PROD_FILE" 2>/dev/null || \
  sed -i 's/\.parentNode\.removeChild(/.parentNode\&\&\0/g' "$PROD_FILE" 2>/dev/null
  echo "Patched React DOM (prod)"
fi
