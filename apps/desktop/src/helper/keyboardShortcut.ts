const isMacOS =
  typeof navigator !== 'undefined' &&
  (/Mac|iP(hone|[oa]d)/.test(navigator.platform) ||
    /macintosh|mac os x/i.test(navigator.userAgent))

export const toggleEditorTypeShortcut = isMacOS ? '⌘/' : 'Ctrl+/'
