import Root from '@/router/Root'
import useEditorStore from '@/stores/useEditorStore'
import { EditorView as CodeMirrorEditorView } from '@codemirror/view'
import { AllSelection } from '@rme-sdk/pm/state'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router'
import AppThemeProvider from './AppThemeProvider'
import { Modal } from './components'
import { AppNotifications } from './components/AppNotifications'
import { MODAL_CONFIRM_ID, MODAL_INFO_ID, MODAL_INPUT_ID } from './components/Modal'
import { ContextMenu, hideContextMenu, showContextMenu } from './components/ui-v2/ContextMenu/ContextMenu'
import { sourceCodeCodemirrorViewMap } from './components/EditorArea/TextEditor'
import { clipboardRead } from './helper/clipboard'
import { useAppSetup } from './hooks'

const getEditorContextTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  return target.closest('#editorarea-wrapper') as HTMLElement | null
}

const getEditorTargets = () => {
  const { activeId, getEditorDelegate } = useEditorStore.getState()
  const sourceCodeView = activeId ? sourceCodeCodemirrorViewMap.get(activeId)?.cm : undefined
  const wysiwygView = activeId ? getEditorDelegate(activeId)?.manager.view : undefined

  return {
    sourceCodeView,
    wysiwygView,
    isSourceCode: Boolean(
      activeId &&
        document.querySelector(`#editorarea-wrapper.editor-view-sourceCode.editor-active`) &&
        sourceCodeView,
    ),
  }
}

const isSelectAllKeyboardEvent = (event: KeyboardEvent) => {
  return (
    (event.key.toLowerCase() === 'a' || event.code === 'KeyA') &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  )
}

const selectCodeMirrorContent = (view: CodeMirrorEditorView) => {
  view.focus()
  view.dispatch({
    selection: { anchor: 0, head: view.state.doc.length },
    scrollIntoView: true,
  })
}

const getWysiwygCodeBlockView = (target?: EventTarget | null) => {
  const targetElement = target instanceof HTMLElement ? target : null
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const codeMirrorElement =
    targetElement?.closest('.cm-editor') ??
    activeElement?.closest('.cm-editor') ??
    document.querySelector('.editor-view-wysiwyg.editor-active .cm-editor.cm-focused')
  if (!(codeMirrorElement instanceof HTMLElement)) {
    return null
  }

  const editorWrapper = codeMirrorElement.closest(
    '#editorarea-wrapper.editor-view-wysiwyg.editor-active',
  )
  if (!(editorWrapper instanceof HTMLElement) || !(codeMirrorElement instanceof HTMLElement)) {
    return null
  }

  if (!editorWrapper.contains(codeMirrorElement)) {
    return null
  }

  return CodeMirrorEditorView.findFromDOM(codeMirrorElement)
}

const selectEditorContent = () => {
  const activeCodeBlockView = getWysiwygCodeBlockView()
  if (activeCodeBlockView) {
    selectCodeMirrorContent(activeCodeBlockView)
    return
  }

  const { sourceCodeView, wysiwygView, isSourceCode } = getEditorTargets()

  if (isSourceCode && sourceCodeView) {
    sourceCodeView.focus()
    sourceCodeView.dispatch({
      selection: { anchor: 0, head: sourceCodeView.state.doc.length },
    })
    return
  }

  if (wysiwygView) {
    wysiwygView.focus()
    wysiwygView.dispatch(wysiwygView.state.tr.setSelection(new AllSelection(wysiwygView.state.doc)))
    return
  }

  document.execCommand('selectAll')
}

const getEditorSelectionText = () => {
  const { sourceCodeView, wysiwygView, isSourceCode } = getEditorTargets()

  if (isSourceCode && sourceCodeView) {
    const { from, to } = sourceCodeView.state.selection.main
    return sourceCodeView.state.sliceDoc(from, to)
  }

  if (wysiwygView) {
    const { from, to } = wysiwygView.state.selection
    return wysiwygView.state.doc.textBetween(from, to, '\n')
  }

  return window.getSelection()?.toString() ?? ''
}

const pasteTextToEditor = async () => {
  const { text } = await clipboardRead()
  if (!text) return

  const { sourceCodeView, wysiwygView, isSourceCode } = getEditorTargets()

  if (isSourceCode && sourceCodeView) {
    const { from, to } = sourceCodeView.state.selection.main
    sourceCodeView.focus()
    sourceCodeView.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    })
    return
  }

  if (wysiwygView) {
    const { from, to } = wysiwygView.state.selection
    wysiwygView.focus()
    wysiwygView.dispatch(wysiwygView.state.tr.insertText(text, from, to).scrollIntoView())
    return
  }

  document.execCommand('insertText', false, text)
}

const copyEditorSelection = async () => {
  const text = getEditorSelectionText()
  if (text) {
    await writeText(text)
    return
  }

  document.execCommand('copy')
}

const cutEditorSelection = async () => {
  const { sourceCodeView, wysiwygView, isSourceCode } = getEditorTargets()

  if (isSourceCode && sourceCodeView) {
    await copyEditorSelection()
    sourceCodeView.focus()
    sourceCodeView.dispatch(sourceCodeView.state.replaceSelection(''))
    return
  }

  if (wysiwygView) {
    await copyEditorSelection()
    wysiwygView.focus()
    wysiwygView.dispatch(wysiwygView.state.tr.deleteSelection().scrollIntoView())
    return
  }

  document.execCommand('cut')
}

function App() {
  useAppSetup()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSelectAllKeyboardEvent(event)) {
        return
      }

      const activeCodeBlockView = getWysiwygCodeBlockView(event.target)
      if (!activeCodeBlockView) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      selectCodeMirrorContent(activeCodeBlockView)
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target.closest('[role="menu"]')) {
        return
      }

      if (getEditorContextTarget(target)) {
        hideContextMenu()
      }
    }

    const handleContextMenu = (event: MouseEvent) => {
      const editorTarget = getEditorContextTarget(event.target)

      event.preventDefault()

      if (!editorTarget) {
        return
      }

      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        items: [
          {
            label: '剪切',
            value: 'cut',
            handler: () => {
              cutEditorSelection()
            },
          },
          {
            label: '复制',
            value: 'copy',
            handler: () => {
              copyEditorSelection()
            },
          },
          {
            label: '粘贴',
            value: 'paste',
            handler: () => {
              pasteTextToEditor()
            },
          },
          {
            label: '全选',
            value: 'select_all',
            handler: () => {
              selectEditorContent()
            },
          },
        ],
      })
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    document.addEventListener('pointerdown', handlePointerDown, { capture: true })
    document.addEventListener('contextmenu', handleContextMenu, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true })
    }
  }, [])

  return (
    <AppThemeProvider>
      <ContextMenu />
      <AppNotifications />
      <Modal.InputConfirm id={MODAL_INPUT_ID} />
      <Modal.Info id={MODAL_INFO_ID} />
      <Modal.Confirm id={MODAL_CONFIRM_ID} />
      <Routes>
        <Route index path='/' element={<Root />} />
      </Routes>
    </AppThemeProvider>
  )
}

export default App
