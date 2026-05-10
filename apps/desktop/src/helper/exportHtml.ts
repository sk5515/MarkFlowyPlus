type BuildExportHtmlOptions = {
  title: string
  content: string
  editorClassName?: string
  themeMode?: string
  fullWidth?: boolean
  rootFontSize?: number
  rootLineHeight?: number
  rootFontFamily?: string
  codeFontFamily?: string
  themeBackgroundColor?: string
  themeTextColor?: string
  themeLinkColor?: string
  themeBorderColor?: string
}

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const PAGE_MARGIN_MM = 18

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const collectDocumentStyles = () => {
  const cssText: string[] = []

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || [])
        .map((rule) => rule.cssText)
        .join('\n')

      if (rules) {
        cssText.push(rules)
      }
    } catch {
      const owner = sheet.ownerNode
      if (owner instanceof HTMLStyleElement && owner.textContent) {
        cssText.push(owner.textContent)
      }
    }
  })

  return cssText.join('\n\n')
}

const slugifyHeading = (value: string, index: number) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/^-+|-+$/g, '')

  return normalized || `heading-${index + 1}`
}

const prepareExportContent = (content: string) => {
  const template = document.createElement('template')
  template.innerHTML = content

  const usedIds = new Set<string>()
  template.content.querySelectorAll('[id]').forEach((element) => {
    const id = element.getAttribute('id')
    if (id) {
      usedIds.add(id)
    }
  })

  template.content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((heading, index) => {
    const level = Number(heading.tagName.slice(1))
    const title = heading.textContent?.trim() || `Heading ${index + 1}`
    let id = heading.getAttribute('id') || slugifyHeading(title, index)
    let nextId = id
    let suffix = 2

    while (usedIds.has(nextId)) {
      nextId = `${id}-${suffix}`
      suffix += 1
    }

    id = nextId
    usedIds.add(id)
    heading.setAttribute('id', id)
    heading.setAttribute('data-pdf-bookmark', title)
    heading.setAttribute('data-pdf-bookmark-level', String(level))
  })

  return template.innerHTML
}

const buildExportStyles = (options: BuildExportHtmlOptions) => {
  const rootFontSize = options.rootFontSize || 16
  const rootLineHeight = options.rootLineHeight || 1.7
  const rootFontFamily =
    options.rootFontFamily ||
    '"Open Sans", "Clear Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'
  const codeFontFamily =
    options.codeFontFamily ||
    '"Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'
  const themeBackgroundColor =
    options.themeBackgroundColor || (options.themeMode === 'dark' ? '#1f2328' : '#ffffff')
  const themeTextColor = options.themeTextColor || (options.themeMode === 'dark' ? '#e6edf3' : '#111111')
  const themeLinkColor = options.themeLinkColor || (options.themeMode === 'dark' ? '#58a6ff' : '#0645ad')
  const themeBorderColor = options.themeBorderColor || 'currentColor'

  return `
    @page {
      size: A4 portrait;
      margin: ${PAGE_MARGIN_MM}mm;
      background: ${themeBackgroundColor};
    }

    :root {
      color-scheme: ${options.themeMode === 'dark' ? 'dark' : 'light'};
      --editor-code-block-max-width: 100%;
      --mf-export-bg-color: ${themeBackgroundColor};
      --mf-export-text-color: ${themeTextColor};
      --mf-export-link-color: ${themeLinkColor};
      --mf-export-border-color: ${themeBorderColor};
    }

    *,
    *::before,
    *::after {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html,
    body {
      min-height: 100%;
      margin: 0;
      overflow: auto;
      border-radius: 0;
      background: var(--mf-export-bg-color);
      color: var(--mf-export-text-color);
    }

    body {
      padding: 40px 28px;
      box-sizing: border-box;
      background: var(--mf-export-bg-color);
    }

    .mf-export-page {
      width: 100%;
      max-width: ${options.fullWidth ? 'none' : '860px'};
      margin: 0 auto;
      box-sizing: border-box;
      background: var(--mf-export-bg-color);
    }

    .mf-export-content {
      display: block !important;
      height: auto !important;
      min-height: auto !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 0 32px !important;
      font-size: ${rootFontSize}px;
      line-height: ${rootLineHeight};
      font-family: ${rootFontFamily};
      color: inherit;
      background: var(--mf-export-bg-color);
      overflow: visible !important;
    }

    .mf-export-content a {
      color: var(--mf-export-link-color);
    }

    .mf-export-content > * {
      grid-column: auto !important;
      grid-row: auto !important;
    }

    .mf-export-content h1,
    .mf-export-content h2,
    .mf-export-content h3,
    .mf-export-content h4,
    .mf-export-content h5,
    .mf-export-content h6 {
      line-height: 1.28;
      margin: 1.4em 0 0.55em;
      letter-spacing: 0;
      page-break-after: avoid;
      break-after: avoid;
      bookmark-label: attr(data-pdf-bookmark);
    }

    .mf-export-content h1 {
      bookmark-level: 1;
    }

    .mf-export-content h2 {
      bookmark-level: 2;
    }

    .mf-export-content h3 {
      bookmark-level: 3;
    }

    .mf-export-content h4 {
      bookmark-level: 4;
    }

    .mf-export-content h5 {
      bookmark-level: 5;
    }

    .mf-export-content h6 {
      bookmark-level: 6;
    }

    .mf-export-content h1:first-child,
    .mf-export-content h2:first-child,
    .mf-export-content h3:first-child {
      margin-top: 0;
    }

    .mf-export-content p,
    .mf-export-content ul,
    .mf-export-content ol,
    .mf-export-content blockquote,
    .mf-export-content table,
    .mf-export-content pre,
    .mf-export-content figure {
      margin-top: 0;
      margin-bottom: 1em;
    }

    .mf-export-content p,
    .mf-export-content li,
    .mf-export-content blockquote,
    .mf-export-content tr {
      orphans: 3;
      widows: 3;
    }

    .mf-export-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }

    .mf-export-content table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
      overflow-wrap: anywhere;
      page-break-inside: auto;
      break-inside: auto;
    }

    .mf-export-content thead {
      display: table-header-group;
    }

    .mf-export-content tfoot {
      display: table-footer-group;
    }

    .mf-export-content th,
    .mf-export-content td {
      border: 1px solid currentColor;
      border-color: var(--mf-export-border-color);
      padding: 6px 10px;
      vertical-align: top;
    }

    .mf-export-content blockquote {
      padding: 0.1em 1em;
      border-left: 4px solid var(--mf-export-border-color);
      opacity: 0.82;
    }

    .mf-export-content pre,
    .mf-export-content code,
    .mf-export-content tt,
    .mf-export-content .cm-content,
    .mf-export-content .cm-line {
      font-family: ${codeFontFamily};
    }

    .mf-export-content pre,
    .mf-export-content .cm-editor {
      border-radius: 6px;
      overflow-x: auto !important;
      white-space: pre !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .mf-export-content .cm-copy-btn,
    .mf-export-content .code-block__menu,
    .mf-export-content .code-block__languages,
    .mf-export-content .rme-block-handler,
    .mf-export-content [contenteditable='true'] [data-placeholder]::before {
      display: none !important;
    }

    @media print {
      html,
      body {
        background: var(--mf-export-bg-color) !important;
        color: var(--mf-export-text-color) !important;
      }

      html {
        width: ${PAGE_WIDTH_MM}mm;
      }

      body {
        padding: 0;
        width: auto;
        min-height: ${PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2}mm;
      }

      .mf-export-page {
        max-width: none;
      }

      .mf-export-content {
        font-size: ${rootFontSize}px;
      }

      .mf-export-content a {
        color: var(--mf-export-link-color);
      }
    }
  `
}

const readCssColor = (styles: CSSStyleDeclaration, key: string) => {
  const value = styles.getPropertyValue(key).trim()
  return value || undefined
}

export const buildExportHtml = (options: BuildExportHtmlOptions) => {
  const title = escapeHtml(options.title || 'Document')
  const themeMode = options.themeMode || document.documentElement.dataset.themeMode || 'light'
  const rootStyles = getComputedStyle(document.documentElement)
  const bodyStyles = getComputedStyle(document.body)
  const themeBackgroundColor =
    options.themeBackgroundColor ||
    readCssColor(rootStyles, '--mf-bg-color') ||
    bodyStyles.backgroundColor ||
    rootStyles.backgroundColor
  const themeTextColor = options.themeTextColor || bodyStyles.color || rootStyles.color
  const themeLinkColor =
    options.themeLinkColor ||
    readCssColor(rootStyles, '--mf-accent-color') ||
    readCssColor(rootStyles, '--mf-primary-color')
  const themeBorderColor = options.themeBorderColor || bodyStyles.borderColor || rootStyles.borderColor
  const content = prepareExportContent(options.content)
  const editorClassName = [
    options.editorClassName || 'markdown-body editor-view-wysiwyg',
    'mf-export-content',
  ]
    .join(' ')
    .trim()

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme-mode="${escapeHtml(themeMode)}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${collectDocumentStyles()}

${buildExportStyles({
  ...options,
  themeMode,
  themeBackgroundColor,
  themeTextColor,
  themeLinkColor,
  themeBorderColor,
})}
  </style>
</head>
<body>
  <main class="mf-export-page">
    <article class="${escapeHtml(editorClassName)}">
${content}
    </article>
  </main>
</body>
</html>
`
}
