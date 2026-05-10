const preserveEditorScroll = (callback: () => void) => {
  const editorPanel = document.querySelector('#editor-panel') as HTMLElement | null
  const scrollTop = editorPanel?.scrollTop ?? 0
  const scrollLeft = editorPanel?.scrollLeft ?? 0
  const windowScrollX = window.scrollX
  const windowScrollY = window.scrollY

  callback()

  const restore = () => {
    if (editorPanel) {
      editorPanel.scrollTop = scrollTop
      editorPanel.scrollLeft = scrollLeft
    }

    window.scrollTo(windowScrollX, windowScrollY)
  }

  restore()
  requestAnimationFrame(restore)
}

export const openSlashMenu = (view?: any) => {
  if (!view) {
    return false
  }

  const slashPlugin = view.state.plugins.find((plugin: any) => {
    const pluginState = plugin.getState?.(view.state)
    return (
      pluginState &&
      typeof pluginState.open === 'boolean' &&
      typeof pluginState.filter === 'string' &&
      Array.isArray(pluginState.ignoredKeys)
    )
  }) as any
  const pluginKey = slashPlugin?.spec?.key

  if (!pluginKey) {
    return false
  }

  preserveEditorScroll(() => {
    view.focus()
    view.dispatch(view.state.tr.setMeta(pluginKey, { type: 'open' }))
  })

  return true
}
