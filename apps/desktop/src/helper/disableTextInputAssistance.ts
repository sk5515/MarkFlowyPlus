const TEXT_INPUT_SELECTOR = 'input, textarea, [contenteditable="true"], .cm-content'

const disableTextInputAssistance = (element: Element) => {
  if (!(element instanceof HTMLElement)) {
    return
  }

  element.setAttribute('spellcheck', 'false')
  element.setAttribute('autocorrect', 'off')
  element.setAttribute('autocapitalize', 'off')
  element.setAttribute('autocomplete', 'off')
}

const disableTextInputAssistanceIn = (root: ParentNode) => {
  if (root instanceof Element && root.matches(TEXT_INPUT_SELECTOR)) {
    disableTextInputAssistance(root)
  }

  root.querySelectorAll(TEXT_INPUT_SELECTOR).forEach(disableTextInputAssistance)
}

export const installDisableTextInputAssistance = (root: HTMLElement) => {
  disableTextInputAssistanceIn(root)

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          disableTextInputAssistanceIn(node)
        }
      })
    })
  })

  observer.observe(root, {
    childList: true,
    subtree: true,
  })
}
