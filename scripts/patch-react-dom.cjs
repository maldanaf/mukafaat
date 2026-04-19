/**
 * Patch React DOM production file to prevent removeChild crashes
 * when DOM nodes are removed by browser extensions or other scripts.
 *
 * Runs as postinstall hook.
 */
const fs = require('fs');
const path = require('path');

const prodFile = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'compiled', 'react-dom', 'cjs', 'react-dom-client.production.js');

if (!fs.existsSync(prodFile)) {
  console.log('[patch] react-dom production file not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(prodFile, 'utf8');
let patched = 0;

// Pattern: deletedFiber.parentNode.removeChild(deletedFiber)
// Replace with safe version that checks parentNode first
content = content.replace(
  /(\w+)\.parentNode\.removeChild\(\1\)/g,
  (match, varName) => {
    patched++;
    return `${varName}.parentNode&&${varName}.parentNode.removeChild(${varName})`;
  }
);

if (patched > 0) {
  fs.writeFileSync(prodFile, content);
  console.log(`[patch] Fixed ${patched} removeChild calls in react-dom production`);
} else {
  console.log('[patch] No removeChild patterns found to patch');
}
