const CLICKABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  '[role="button"]',
  '[role="menuitem"]',
  '.icon:not(.icon-disabled)',
  '.list-item',
  '.bookmark-list__item',
  '.search-info',
  '.tab-items__item',
  '.ant-dropdown-menu-item',
  '.ant-select-item-option',
  '.zen-menu-item',
].join(',')

const INTERACTIVE_TEXT_SELECTOR = [
  'input',
  'textarea',
  'select',
  'option',
  'label',
  '[contenteditable="true"]',
  '.cm-editor',
  '.editor-view-wysiwyg',
  '.editor-view-sourceCode',
].join(',')

const shouldUseInstantClick = (event: MouseEvent): Element | null => {
  if (event.button !== 0 || event.defaultPrevented) {
    return null
  }

  const target = event.target
  if (!(target instanceof Element)) {
    return null
  }

  if (target.closest(INTERACTIVE_TEXT_SELECTOR)) {
    return null
  }

  const clickable = target.closest(CLICKABLE_SELECTOR)
  if (!clickable) {
    return null
  }

  if (clickable.closest('[aria-disabled="true"], [data-tauri-drag-region]')) {
    return null
  }

  return clickable
}

export const installInstantClick = (root: HTMLElement) => {
  let pendingNativeClickTarget: Element | null = null
  let pendingNativeClickTime = 0
  let dispatchingInstantClick = false

  root.addEventListener(
    'mousedown',
    (event) => {
      const clickable = shouldUseInstantClick(event)
      if (!clickable) {
        return
      }

      pendingNativeClickTarget = clickable
      pendingNativeClickTime = Date.now()

      const instantClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: 0,
      })

      dispatchingInstantClick = true
      clickable.dispatchEvent(instantClick)
      dispatchingInstantClick = false
    },
    true,
  )

  root.addEventListener(
    'click',
    (event) => {
      if (dispatchingInstantClick) {
        return
      }

      const target = event.target
      const shouldSuppressNativeClick =
        pendingNativeClickTarget &&
        target instanceof Node &&
        (pendingNativeClickTarget === target || pendingNativeClickTarget.contains(target)) &&
        Date.now() - pendingNativeClickTime < 800

      if (!shouldSuppressNativeClick) {
        return
      }

      pendingNativeClickTarget = null
      event.preventDefault()
      event.stopImmediatePropagation()
    },
    true,
  )
}
