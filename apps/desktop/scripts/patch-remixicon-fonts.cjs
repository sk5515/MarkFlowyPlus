const fs = require('fs')
const path = require('path')

const cssPath = path.resolve(__dirname, '../node_modules/remixicon/fonts/remixicon.css')

if (!fs.existsSync(cssPath)) {
  process.exit(0)
}

const css = fs.readFileSync(cssPath, 'utf8')
const patchedFontFace = `@font-face {
  font-family: "remixicon";
  src: url("remixicon.woff2?t=1760071648894") format("woff2");
  font-display: swap;
}`

const patched = css.replace(/@font-face\s*\{[\s\S]*?\n\}/, patchedFontFace)

if (patched !== css) {
  fs.writeFileSync(cssPath, patched)
  console.log('Patched remixicon.css to emit only woff2 font assets.')
}
