const fs = require('fs')
const path = require('path')

const target = path.resolve(__dirname, '../node_modules/rme/dist/index.mjs')

if (!fs.existsSync(target)) {
  console.warn('[patch-rme-inline-ime] rme dist file not found, skipping')
  process.exit(0)
}

const inlineMarkOriginal =
  'if(n.isDestroyed){t=null;return}let i=n.state.doc'
const inlineMarkImeGuard =
  'if(n.isDestroyed||n.composing||n.__markflowyImeLockUntil&&Date.now()<n.__markflowyImeLockUntil){t=null;return}let i=n.state.doc'
const inlineMarkHeadingGuard =
  'if(n.isDestroyed||n.composing||n.__markflowyImeLockUntil&&Date.now()<n.__markflowyImeLockUntil||n.state.selection.$from.parent.type.name==="heading"){t=null;return}let i=n.state.doc'

const inlineDecorationOriginal =
  'if(!pu(e.selection))return null;let t=e.selection.$anchor,o=t.parent;if(!o.isTextblock)return null;'
const inlineDecorationHeadingGuard =
  'if(!pu(e.selection))return null;let t=e.selection.$anchor,o=t.parent;if(!o.isTextblock||o.type.name==="heading")return null;'

const initialInlineMarkOriginal =
  'function rs(e,t,o,r,n){o.attrs.inlineDecorateType!=="IGNORE"&&(o.isTextblock?ru(e,t,o,r,n):o.forEach((i,s)=>{rs(e,t,i,r+s+1,n)}))}'
const initialInlineMarkHeadingGuard =
  'function rs(e,t,o,r,n){o.attrs.inlineDecorateType!=="IGNORE"&&o.type.name!=="heading"&&(o.isTextblock?ru(e,t,o,r,n):o.forEach((i,s)=>{rs(e,t,i,r+s+1,n)}))}'

let source = fs.readFileSync(target, 'utf8')
let changed = false

if (source.includes(inlineMarkHeadingGuard)) {
  console.log('[patch-rme-inline-ime] inline mark already patched')
} else if (source.includes(inlineMarkImeGuard)) {
  source = source.replace(inlineMarkImeGuard, inlineMarkHeadingGuard)
  changed = true
} else if (source.includes(inlineMarkOriginal)) {
  source = source.replace(inlineMarkOriginal, inlineMarkHeadingGuard)
  changed = true
} else {
  console.warn('[patch-rme-inline-ime] inline mark target snippet not found, skipping')
}

if (source.includes(inlineDecorationHeadingGuard)) {
  console.log('[patch-rme-inline-ime] inline decoration already patched')
} else if (source.includes(inlineDecorationOriginal)) {
  source = source.replace(inlineDecorationOriginal, inlineDecorationHeadingGuard)
  changed = true
} else {
  console.warn('[patch-rme-inline-ime] inline decoration target snippet not found, skipping')
}

if (source.includes(initialInlineMarkHeadingGuard)) {
  console.log('[patch-rme-inline-ime] initial inline mark already patched')
} else if (source.includes(initialInlineMarkOriginal)) {
  source = source.replace(initialInlineMarkOriginal, initialInlineMarkHeadingGuard)
  changed = true
} else {
  console.warn('[patch-rme-inline-ime] initial inline mark target snippet not found, skipping')
}

if (!changed) {
  process.exit(0)
}

fs.writeFileSync(target, source)
console.log('[patch-rme-inline-ime] patched inline IME guards')
