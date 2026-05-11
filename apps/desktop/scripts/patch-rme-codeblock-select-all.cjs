const fs = require('fs')
const path = require('path')

const target = path.resolve(__dirname, '../node_modules/rme/dist/index.mjs')

if (!fs.existsSync(target)) {
  console.warn('[patch-rme-codeblock-select-all] rme dist file not found, skipping')
  process.exit(0)
}

let source = fs.readFileSync(target, 'utf8')
const marker = 'codeMirrorKeymap(){let t=['
const selectAllRun =
  'run:()=>(this.cm.dispatch({selection:{anchor:0,head:this.cm.state.doc.length},scrollIntoView:!0}),this.forwardSelection(),!0),preventDefault:!0'
const patch =
  `{key:"Mod-a",mac:"Cmd-a",${selectAllRun}},{key:"Ctrl-a",${selectAllRun}},`
const previousPatch =
  `{key:"Mod-a",${selectAllRun}},`

if (source.includes(previousPatch) && !source.includes(patch)) {
  source = source.replace(previousPatch, patch)
  fs.writeFileSync(target, source)
  console.log('[patch-rme-codeblock-select-all] upgraded code block Cmd-a select all')
  process.exit(0)
}

if (source.includes(`${marker}${patch}`)) {
  console.log('[patch-rme-codeblock-select-all] already patched')
  process.exit(0)
}

const index = source.indexOf(marker)
if (index === -1) {
  console.warn('[patch-rme-codeblock-select-all] keymap marker not found, skipping')
  process.exit(0)
}

const next = source.slice(0, index + marker.length) + patch + source.slice(index + marker.length)
fs.writeFileSync(target, next)
console.log('[patch-rme-codeblock-select-all] patched code block Mod-a select all')
