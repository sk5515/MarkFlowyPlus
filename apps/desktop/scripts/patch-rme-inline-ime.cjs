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
const inlineMarkTyporaGuard =
  'if(n.isDestroyed||n.composing||n.__markflowyImeLockUntil&&Date.now()<n.__markflowyImeLockUntil||n.state.selection.$from.parent.type.name==="heading"||mfInlineImeHold(n)){t=null;return}let i=n.state.doc'
const inlineMarkMarkdownGuard =
  'if(n.isDestroyed||n.composing||n.__markflowyImeLockUntil&&Date.now()<n.__markflowyImeLockUntil||n.state.selection.$from.parent.type.name==="heading"||n.state.selection.$from.parent.content.content.some(e=>e.marks?.some(t=>t.type.name==="mdMark"))){t=null;return}let i=n.state.doc'

const inlineDecorationOriginal =
  'if(!pu(e.selection))return null;let t=e.selection.$anchor,o=t.parent;if(!o.isTextblock)return null;'
const inlineDecorationHeadingGuard =
  'if(!pu(e.selection))return null;let t=e.selection.$anchor,o=t.parent;if(!o.isTextblock||o.type.name==="heading")return null;'
const inlineDecorationMarkdownGuard =
  'if(!pu(e.selection))return null;let t=e.selection.$anchor,o=t.parent;if(!o.isTextblock||o.type.name==="heading"||o.content.content.some(e=>e.marks?.some(t=>t.type.name==="mdMark")))return null;'

const initialInlineMarkOriginal =
  'function rs(e,t,o,r,n){o.attrs.inlineDecorateType!=="IGNORE"&&(o.isTextblock?ru(e,t,o,r,n):o.forEach((i,s)=>{rs(e,t,i,r+s+1,n)}))}'
const initialInlineMarkHeadingGuard =
  'function rs(e,t,o,r,n){o.attrs.inlineDecorateType!=="IGNORE"&&o.type.name!=="heading"&&(o.isTextblock?ru(e,t,o,r,n):o.forEach((i,s)=>{rs(e,t,i,r+s+1,n)}))}'
const initialInlineMarkDisabled =
  'function rs(e,t,o,r,n){}'

const inlineRuntimePluginsOriginal = 'new ie,new gt,new to,new qe(l)'
const inlineRuntimePluginsRemoved = 'new ie,new qe(l)'
const inlineMarkSelectionSetOriginal =
  'if(s.docChanged&&!s.getMeta("APPLY_MARKS"))'
const inlineMarkSelectionSetPatched =
  'if((s.docChanged||s.selectionSet)&&!s.getMeta("APPLY_MARKS"))'
const inlineMarkSelectionOnlyPatched =
  'if(s.selectionSet&&!s.docChanged&&!s.getMeta("APPLY_MARKS"))'
const inlineHoldHelper =
  'function mfInlineImeHold(e){try{let t=e.state.selection;if(!t.empty)return!1;let o=t.$from,r=o.parent;if(!r||!r.isTextblock)return!1;let n=o.parentOffset,i=r.textContent,s="*_`~[]()";if(n>0&&s.includes(i.charAt(n-1)))return!0;if(n<i.length&&s.includes(i.charAt(n)))return!0;let a=o.index(),l=r.maybeChild(a),c=r.maybeChild(Math.max(a-1,0)),d=m=>m?.marks?.some(u=>["mdMark","mdStrong","mdEm","mdDel","mdCodeText","mdLinkText","mdLinkUri","mdImgText","mdImgUri","mdHtmlInline"].includes(u.type.name));return!!(d(l)||d(c))}catch{return!1}}'
const inlineHoldHelperV2 =
  'function mfInlineImeHold(e){try{let t=e.state.selection;if(!t.empty)return!1;let o=t.$from,r=o.parent;if(!r||!r.isTextblock)return!1;let n=o.parentOffset,i=r.textContent,s="*_`~[]()";if(n>0&&s.includes(i.charAt(n-1)))return!0;if(n<i.length&&s.includes(i.charAt(n)))return!0;let a=i.slice(Math.max(0,n-12),Math.min(i.length,n+12));if(/(\\*\\*|__|~~|`|\\[[^\\]]*$|\\]\\([^)]*$)/.test(a))return!0;let l=o.index(),c=r.maybeChild(l),d=r.maybeChild(Math.max(l-1,0)),m=u=>u?.marks?.some(f=>["mdMark","mdStrong","mdEm","mdDel","mdCodeText","mdLinkText","mdLinkUri","mdImgText","mdImgUri","mdHtmlInline"].includes(f.type.name));return!!(m(c)||m(d))}catch{return!1}}'
const inlineHoldHelperV3 =
  'function mfInlineImeHold(e){try{let t=e.state.selection;if(!t.empty)return!1;let o=t.$from,r=o.parent;if(!r||!r.isTextblock)return!1;let n=o.parentOffset,i=r.textContent,s=o.index(),a=r.maybeChild(s),l=r.maybeChild(Math.max(s-1,0)),c=d=>d?.marks?.some(m=>["mdMark","mdStrong","mdEm","mdDel","mdCodeText","mdLinkText","mdLinkUri","mdImgText","mdImgUri","mdHtmlInline"].includes(m.type.name));if(c(a)||c(l))return!0;let d=(m,u)=>{for(let f=0;(f=i.indexOf(m,f))!==-1;f++){let p=f+m.length,x=i.indexOf(u,p);if(x===-1){if(n>=f&&n<=i.length)return!0;break}let b=x+u.length;if(n>=f&&n<=b)return!0;f=x+Math.max(u.length-1,0)}return!1};if(d("**","**")||d("__","__")||d("~~","~~")||d("`","`")||d("*","*")||d("_","_"))return!0;for(let m=0;(m=i.indexOf("[",m))!==-1;m++){let u=i.indexOf("]",m+1),f=u<0?-1:i.indexOf("(",u+1),p=f<0?-1:i.indexOf(")",f+1),x=p<0?i.length:p+1;if((u<0||f<0||p<0)&&n>=m)return!0;if(u>=0&&f===u+1&&n>=m&&n<=x)return!0}return!1}catch{return!1}}'
const inlineHoldHelperAnchor = 'var gt=class extends bu'

let source = fs.readFileSync(target, 'utf8')
let changed = false

if (source.includes(inlineHoldHelperV2)) {
  source = source.replace(inlineHoldHelperV2, inlineHoldHelperV3)
  changed = true
} else if (source.includes(inlineHoldHelper)) {
  source = source.replace(inlineHoldHelper, inlineHoldHelperV3)
  changed = true
} else if (!source.includes(inlineHoldHelperV3)) {
  if (source.includes(inlineHoldHelperAnchor)) {
    source = source.replace(inlineHoldHelperAnchor, `${inlineHoldHelperV3}${inlineHoldHelperAnchor}`)
    changed = true
  } else {
    console.warn('[patch-rme-inline-ime] inline hold helper anchor not found, skipping')
  }
}

if (source.includes(inlineMarkMarkdownGuard)) {
  source = source.replace(inlineMarkMarkdownGuard, inlineMarkTyporaGuard)
  changed = true
} else if (source.includes(inlineMarkTyporaGuard)) {
  console.log('[patch-rme-inline-ime] inline mark already patched')
} else if (source.includes(inlineMarkHeadingGuard)) {
  source = source.replace(inlineMarkHeadingGuard, inlineMarkTyporaGuard)
  changed = true
} else if (source.includes(inlineMarkImeGuard)) {
  source = source.replace(inlineMarkImeGuard, inlineMarkTyporaGuard)
  changed = true
} else if (source.includes(inlineMarkOriginal)) {
  source = source.replace(inlineMarkOriginal, inlineMarkTyporaGuard)
  changed = true
} else {
  console.warn('[patch-rme-inline-ime] inline mark target snippet not found, skipping')
}

if (source.includes(inlineDecorationMarkdownGuard)) {
  source = source.replace(inlineDecorationMarkdownGuard, inlineDecorationHeadingGuard)
  changed = true
} else if (source.includes(inlineDecorationHeadingGuard)) {
  console.log('[patch-rme-inline-ime] inline decoration already patched')
} else if (source.includes(inlineDecorationOriginal)) {
  source = source.replace(inlineDecorationOriginal, inlineDecorationHeadingGuard)
  changed = true
} else {
  console.warn('[patch-rme-inline-ime] inline decoration target snippet not found, skipping')
}

if (source.includes(initialInlineMarkDisabled)) {
  source = source.replace(initialInlineMarkDisabled, initialInlineMarkHeadingGuard)
  changed = true
} else if (source.includes(initialInlineMarkHeadingGuard)) {
  console.log('[patch-rme-inline-ime] initial inline mark already patched')
} else if (source.includes(initialInlineMarkOriginal)) {
  source = source.replace(initialInlineMarkOriginal, initialInlineMarkHeadingGuard)
  changed = true
} else {
  console.warn('[patch-rme-inline-ime] initial inline mark target snippet not found, skipping')
}

if (source.includes(inlineRuntimePluginsRemoved)) {
  source = source.replace(inlineRuntimePluginsRemoved, inlineRuntimePluginsOriginal)
  changed = true
} else if (source.includes(inlineRuntimePluginsOriginal)) {
  console.log('[patch-rme-inline-ime] inline runtime plugins already present')
} else {
  console.warn('[patch-rme-inline-ime] inline runtime plugin list target snippet not found, skipping')
}

if (source.includes(inlineMarkSelectionOnlyPatched)) {
  source = source.replace(inlineMarkSelectionOnlyPatched, inlineMarkSelectionSetPatched)
  changed = true
} else if (source.includes(inlineMarkSelectionSetOriginal)) {
  source = source.replace(inlineMarkSelectionSetOriginal, inlineMarkSelectionSetPatched)
  changed = true
} else if (source.includes(inlineMarkSelectionSetPatched)) {
  console.log('[patch-rme-inline-ime] inline mark selection trigger already patched')
} else {
  console.warn('[patch-rme-inline-ime] inline mark selection trigger target snippet not found, skipping')
}

if (!changed) {
  process.exit(0)
}

fs.writeFileSync(target, source)
console.log('[patch-rme-inline-ime] patched inline IME guards')
