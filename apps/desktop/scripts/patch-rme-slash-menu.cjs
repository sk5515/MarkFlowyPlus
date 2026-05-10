const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'node_modules', 'rme', 'dist', 'index.mjs')
const original =
  'case"openMenu":let a=n.selection.from<0||n.selection.from>n.doc.content.size?null:n.doc.resolve(n.selection.from),l=a?.parent,c=l?.type.name==="paragraph";return a?.depth===1?(c&&l.textContent==="/"&&a&&o.dispatch(n.tr.delete(a.start(),a.end()).setMeta(this.spec.key,{type:"open"})),he(o,this.spec.key,{type:"open"}),!0):!1;case"closeMenu"'
const replacement = 'case"openMenu":return!1;case"closeMenu"'

if (!fs.existsSync(filePath)) {
  process.exit(0)
}

const source = fs.readFileSync(filePath, 'utf8')

if (source.includes(replacement)) {
  process.exit(0)
}

if (!source.includes(original)) {
  console.warn('patch-rme-slash-menu: target snippet not found')
  process.exit(0)
}

fs.writeFileSync(filePath, source.replace(original, replacement))
