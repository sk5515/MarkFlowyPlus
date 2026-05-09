import { EVENT } from '@/constants'
import { clipboardRead } from '@/helper/clipboard'
import bus from '@/helper/eventBus'
import {
  delSaveOpenedEditorEntries,
  getFileObject,
  setSaveOpenedEditorEntries,
  updateFileObject,
} from '@/helper/files'
import {
  canvasDataToBinary,
  FileResultCode,
  FileSysResult,
  getFileNameFromPath,
} from '@/helper/filesys'
import { FileTypeConfig } from '@/helper/fileTypeHandler'
import { logger } from '@/helper/logger'
import { canvasToPdfBytes } from '@/helper/pdf'
import { useEditorKeybindingStore } from '@/hooks/useKeyboard'
import { useCommandStore, useEditorStateStore, useEditorStore } from '@/stores'
import useAppSettingStore from '@/stores/useAppSettingStore'
import useEditorCounterStore from '@/stores/useEditorCounterStore'
import useEditorViewTypeStore from '@/stores/useEditorViewTypeStore'
import * as Sentry from '@sentry/react'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import classNames from 'classnames'
import html2canvas from 'html2canvas'
import { debounce, DebouncedFunc, throttle } from 'lodash'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMount, useUnmount } from 'react-use'
import {
  createSourceCodeDelegate,
  createWysiwygDelegate,
  EditorChangeEventParams,
  EditorChangeHandler,
  EditorContext,
  EditorRef,
  EditorViewType,
  MfCodemirrorView,
  Editor as MfEditor,
  EditorProps as MfEditorProps,
} from 'rme'
import { toast } from 'zens'
import { createWysiwygDelegateOptions } from './createWysiwygDelegateOptions'
import { EditorWrapper, HeadingCursorIndicator } from './EditorWrapper'
import { WarningHeader } from './styles'

type SaveHandlerParams = {
  /**
   * when active is true, saveHandler will save the file content to disk.
   * when active is false, saveHandler will save when editor is active.
   */
  active?: boolean
  onSuccess?: () => void
  onFinally?: () => void
}

type HeadingIndicatorState = {
  level: number
  left: number
  top: number
}

enum TextEditorStatus {
  LOADING,
  SUCCESS,
  NOTEXIST,
}

export const sourceCodeCodemirrorViewMap: Map<string, MfCodemirrorView> = new Map()

function TextEditor(props: TextEditorProps) {
  const { id, active, fileTypeConfig } = props
  const curFile = getFileObject(id)
  const createDelegate = useCallback(
    (editorViewType = EditorViewType.WYSIWYG, sourceCodeLanguage?: string) => {
      if (editorViewType === 'sourceCode') {
        return createSourceCodeDelegate({
          language: sourceCodeLanguage,
          disableAllBuildInShortcuts: true,
          overrideShortcutMap: useEditorKeybindingStore.getState().editorKeybingMap,
          clipboardReadFunction: clipboardRead,
          onCodemirrorViewLoad: (cmView) => {
            sourceCodeCodemirrorViewMap.set(id, cmView)
          },
        })
      } else {
        return createWysiwygDelegate(createWysiwygDelegateOptions(id))
      }
    },
    [id],
  )
  const [status, setStatus] = useState(TextEditorStatus.LOADING)

  const { setEditorDelegate, setEditorCtx, getEditorContent, insertNodeToFolderData } =
    useEditorStore()
  const { execute } = useCommandStore()
  const editorViewType =
    useEditorViewTypeStore((state) => state.editorViewTypeMap.get(id)) || fileTypeConfig.defaultMode
  const { t } = useTranslation()
  const { settingData } = useAppSettingStore()
  const [content, setContent] = useState<string>()
  const [headingIndicator, setHeadingIndicator] = useState<HeadingIndicatorState | null>(null)
  const [delegate, setDelegate] = useState(
    createDelegate(fileTypeConfig.defaultMode, fileTypeConfig.type),
  )

  const debounceSaveHandlerCacheRef = useRef<DebouncedFunc<() => Promise<void>>>(null)
  const noFileSaveingRef = useRef(false)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorRef>(null)
  const editorContextRef = useRef<EditorChangeEventParams>(null)

  const updateCodeBlockMaxWidth = useCallback(() => {
    const wrapper = editorWrapperRef.current
    const editorPanel = document.querySelector('#editor-panel') as HTMLElement | null

    if (!wrapper || !editorPanel) {
      return
    }

    const panelRect = editorPanel.getBoundingClientRect()
    const codeBlock = wrapper.querySelector('.cm-editor') as HTMLElement | null
    const wrapperRect = wrapper.getBoundingClientRect()
    const contentStart = codeBlock?.getBoundingClientRect().left || wrapperRect.left + 40
    const editorInlineGap = 32
    const availableWidth = Math.max(
      120,
      Math.floor(panelRect.right - contentStart - editorInlineGap),
    )

    wrapper.style.setProperty('--editor-code-block-max-width', `${availableWidth}px`)
  }, [])

  const updateHeadingIndicator = useCallback(
    (state?: EditorChangeEventParams['state']) => {
      const wrapper = editorWrapperRef.current
      const view = delegate.manager.view

      if (!active || editorViewType !== EditorViewType.WYSIWYG || !wrapper || !view) {
        setHeadingIndicator(null)
        return
      }

      const editorPanel = document.querySelector('#editor-panel') as HTMLElement | null
      const visibleRect = editorPanel?.getBoundingClientRect() || wrapper.getBoundingClientRect()
      const showIndicator = (level: number, rect: DOMRect) => {
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > visibleRect.top &&
          rect.top < visibleRect.bottom &&
          rect.right > visibleRect.left &&
          rect.left < visibleRect.right

        if (!isVisible) {
          setHeadingIndicator(null)
          return
        }

        setHeadingIndicator({
          level,
          left: Math.max(0, Math.round(rect.left - 32)),
          top: Math.round(rect.top + rect.height / 2),
        })
      }

      const domSelection = document.getSelection()
      const selectionNode = domSelection?.isCollapsed ? domSelection.anchorNode : null
      const selectionElement =
        selectionNode instanceof HTMLElement ? selectionNode : selectionNode?.parentElement
      const headingElement = selectionElement?.closest('h1,h2,h3,h4,h5,h6') as HTMLElement | null

      if (headingElement && wrapper.contains(headingElement)) {
        const rect = headingElement.getBoundingClientRect()
        const level = Number(headingElement.tagName.slice(1))

        showIndicator(level, rect)
        return
      }

      const { selection } = state || view.state
      if (!selection?.empty) {
        setHeadingIndicator(null)
        return
      }

      const { $from } = selection
      const parent = $from.parent
      const level = Number(parent?.attrs?.level)

      if (parent?.type?.name !== 'heading' || !Number.isInteger(level)) {
        setHeadingIndicator(null)
        return
      }

      const headingPos = $from.depth > 0 ? $from.before($from.depth) : $from.pos
      const headingNode = view.nodeDOM(headingPos) as HTMLElement | null
      const fallbackHeadingElement =
        headingNode?.matches('h1,h2,h3,h4,h5,h6')
          ? headingNode
          : (headingNode?.querySelector('h1,h2,h3,h4,h5,h6') as HTMLElement | null)
      const rect = fallbackHeadingElement?.getBoundingClientRect()

      if (!rect || !fallbackHeadingElement || !wrapper.contains(fallbackHeadingElement)) {
        setHeadingIndicator(null)
        return
      }

      showIndicator(level, rect)
    },
    [active, delegate.manager.view, editorViewType],
  )

  useMount(async () => {
    setEditorDelegate(id, delegate)
  })

  useUnmount(() => {
    useEditorCounterStore.getState().deleteEditorCounter({ id })
    const { delIdStateMap } = useEditorStateStore.getState()

    delIdStateMap(id)
  })

  useLayoutEffect(() => {
    if (!active) {
      return
    }

    const wrapper = editorWrapperRef.current
    const editorPanel = document.querySelector('#editor-panel') as HTMLElement | null

    updateCodeBlockMaxWidth()
    const frame = window.requestAnimationFrame(updateCodeBlockMaxWidth)

    const resizeObserver = new ResizeObserver(updateCodeBlockMaxWidth)
    if (wrapper) {
      resizeObserver.observe(wrapper)
    }
    if (editorPanel) {
      resizeObserver.observe(editorPanel)
    }

    window.addEventListener('resize', updateCodeBlockMaxWidth)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateCodeBlockMaxWidth)
      resizeObserver.disconnect()
    }
  }, [
    active,
    content,
    editorViewType,
    settingData.editor_full_width,
    updateCodeBlockMaxWidth,
  ])

  useLayoutEffect(() => {
    if (!active || editorViewType !== EditorViewType.WYSIWYG) {
      setHeadingIndicator(null)
      return
    }

    const view = delegate.manager.view
    if (!view) {
      setHeadingIndicator(null)
      return
    }

    const editorPanel = document.querySelector('#editor-panel') as HTMLElement | null
    let updateFrame = 0
    const update = () => {
      window.cancelAnimationFrame(updateFrame)
      updateFrame = window.requestAnimationFrame(() => updateHeadingIndicator())
    }
    const clear = () => setHeadingIndicator(null)
    const initialFrame = window.requestAnimationFrame(update)

    view.dom.addEventListener('focusin', update)
    view.dom.addEventListener('focusout', clear)
    view.dom.addEventListener('keyup', update)
    view.dom.addEventListener('mouseup', update)
    view.dom.addEventListener('pointerup', update)
    document.addEventListener('selectionchange', update)
    document.addEventListener('scroll', update, true)
    editorPanel?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.cancelAnimationFrame(initialFrame)
      window.cancelAnimationFrame(updateFrame)
      view.dom.removeEventListener('focusin', update)
      view.dom.removeEventListener('focusout', clear)
      view.dom.removeEventListener('keyup', update)
      view.dom.removeEventListener('mouseup', update)
      view.dom.removeEventListener('pointerup', update)
      document.removeEventListener('selectionchange', update)
      document.removeEventListener('scroll', update, true)
      editorPanel?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      clear()
    }
  }, [active, delegate.manager.view, editorViewType, updateHeadingIndicator])

  useLayoutEffect(() => {
    const init = async () => {
      const file = curFile
      if (file.path) {
        const isExists = await invoke('file_exists', { filePath: file.path })
        if (isExists) {
          const res = await invoke<FileSysResult>('get_file_content', {
            filePath: file.path,
          })
          if (res.code !== FileResultCode.Success) {
            toast.error(res.content)
            return
          }
          setContent(res.content)
        } else {
          return setStatus(TextEditorStatus.NOTEXIST)
        }
      } else if (file.content !== undefined) {
        setContent(file.content)
      }

      return setStatus(TextEditorStatus.SUCCESS)
    }
    init()
  }, [delegate, curFile, setEditorDelegate])

  const saveHandler = useCallback(
    async (params: SaveHandlerParams = {}) => {
      const { onSuccess, onFinally } = params
      const runFinally = () => {
        onFinally?.()
      }
      const runSuccess = () => {
        try {
          onSuccess?.()
        } finally {
          runFinally()
        }
      }

      if (!active && !params.active) {
        runFinally()
        return
      }
      const curFile = getFileObject(id)
      if (!curFile) {
        runFinally()
        return
      }

      const { idStateMap, setIdStateMap } = useEditorStateStore.getState()

      const curEditorState = idStateMap.get(curFile.id)

      if (!curEditorState?.hasUnsavedChanges) {
        runSuccess()
        return
      }

      if (!editorContextRef.current?.state.doc && !curFile.content) {
        // Unexpected
        runFinally()
        return
      }

      const fileContent = editorContextRef.current?.state.doc
        ? delegate.docToString(editorContextRef.current.state.doc)
        : curFile.content

      logger.info('editorContent', fileContent)

      try {
        if (!curFile.path) {
          if (noFileSaveingRef.current === true) {
            runFinally()
            return
          }

          noFileSaveingRef.current = true
          save({
            title: 'Save File',
            defaultPath: curFile.name ?? `${t('file.untitled')}.md`,
          })
            .then((path) => {
              noFileSaveingRef.current = false

              if (path === null) {
                runFinally()
                return
              }
              const filename = getFileNameFromPath(path)
              updateFileObject(curFile.id, { ...curFile, path, name: filename })
              insertNodeToFolderData({
                ...curFile,
                name: filename,
                content: fileContent,
                path,
              })
              invoke<FileSysResult>('write_file', { filePath: path, content: fileContent }).then(
                (res) => {
                  if (res.code !== FileResultCode.Success) {
                    runFinally()
                    return toast.error(res.content)
                  }
                  runSuccess()
                },
              ).catch((error) => {
                toast.error(String(error))
                runFinally()
              })
              setIdStateMap(curFile.id, {
                hasUnsavedChanges: false,
              })
            })
            .catch((error) => {
              noFileSaveingRef.current = false
              toast.error(String(error))
              runFinally()
            })
        } else {
          invoke<FileSysResult>('write_file', {
            filePath: curFile.path,
            content: fileContent,
          }).then((res) => {
            if (res.code !== FileResultCode.Success) {
              runFinally()
              return toast.error(res.content)
            }
            setContent(fileContent)
            runSuccess()
          }).catch((error) => {
            toast.error(String(error))
            runFinally()
          })

          setIdStateMap(curFile.id, {
            hasUnsavedChanges: false,
          })
        }
      } catch (error) {
        toast.error(String(error))
        runFinally()
      }
    },
    [active, id, delegate, t, insertNodeToFolderData],
  )

  const debounceSave = useMemo(() => {
    return debounce(() => saveHandler({ active: true }), settingData.autosave_interval)
  }, [settingData.autosave_interval, saveHandler])

  const debounceRefreshToc = useMemo(
    () => debounce(() => execute('app:toc_refresh'), 1000),
    [execute],
  )

  const debounceSaveHandler = useCallback(() => {
    if (debounceSave) {
      debounceSaveHandlerCacheRef.current?.cancel()

      debounceSaveHandlerCacheRef.current = debounceSave
      debounceSave()
    }
  }, [debounceSave])

  useLayoutEffect(() => {
    setSaveOpenedEditorEntries(id, () => saveHandler({ active: true }))

    return () => {
      delSaveOpenedEditorEntries(id)
    }
  }, [debounceSave])

  const setContentHandler = useCallback(
    (newContent: string) => {
      if (!active) return
      editorRef.current?.setContent(newContent)
      setContent(newContent)
      
      // Set save state to unsaved after content change
      const { setIdStateMap } = useEditorStateStore.getState()
      setIdStateMap(id, {
        hasUnsavedChanges: true,
      })
    },
    [active, id],
  )

  const editorTypeSwitchingRef = useRef(false)

  useEffect(() => {
    const cb = throttle((payload: EditorViewType) => {
      if (active) {
        if (editorTypeSwitchingRef.current) {
          return
        }

        if (editorRef.current?.getType() === payload) {
          return
        }

        editorTypeSwitchingRef.current = true
        bus.emit(EVENT.app_save, {
          onSuccess: () => {
            if (payload === EditorViewType.SOURCECODE) {
              const sourceCodeDelegate = createSourceCodeDelegate({
                disableAllBuildInShortcuts: true,
                overrideShortcutMap: useEditorKeybindingStore.getState().editorKeybingMap,
                clipboardReadFunction: clipboardRead,
                onCodemirrorViewLoad: (cmView) => {
                  sourceCodeCodemirrorViewMap.set(curFile.id, cmView)
                  setTimeout(() => {
                    execute('app:toc_refresh')
                  })
                },
              })
              setEditorDelegate(curFile.id, sourceCodeDelegate)
              setDelegate(sourceCodeDelegate)
            } else if (payload === EditorViewType.PREVIEW) {
              debounceRefreshToc()
            } else {
              const wysiwygDelegate = createWysiwygDelegate(
                createWysiwygDelegateOptions(curFile.id),
              )
              setEditorDelegate(curFile.id, wysiwygDelegate)
              setDelegate(wysiwygDelegate)
              debounceRefreshToc()
            }
            useEditorViewTypeStore.getState().setEditorViewType(curFile.id, payload)
            editorRef.current?.toggleType(payload)
          },
          onFinally: () => {
            editorTypeSwitchingRef.current = false
          },
        })
      }
    }, 300, { leading: true, trailing: false })

    bus.on('editor_toggle_type', cb)

    return () => {
      cb.cancel()
      bus.detach('editor_toggle_type', cb)
    }
  }, [active, curFile, execute, setEditorDelegate, getEditorContent, debounceRefreshToc])

  useEffect(() => {
    const exportImageHandler = async () => {
      if (!active) {
        return
      }

      save({
        title: t('contextmenu.editor_tab.export_image'),
        defaultPath: curFile.name.split('.')?.[0] + '.jpg',
      }).then(async (path) => {
        if (!path) return

        const n = toast.loading(t('contextmenu.editor_tab.export_image') + '...')

        html2canvas(document.getElementById(id) as HTMLElement).then((canvas) => {
          // to base 64
          const image = canvas.toDataURL('image/jpg')

          const data = canvasDataToBinary(image)

          invoke('write_u8_array_to_file', { filePath: path, content: data })
            .then(() => {
              toast.dismiss(n)
              toast.success('Exported to ' + path)
            })
            .catch((error) => {
              toast.dismiss(n)
              toast.error(String(error))
            })
        })
      })
    }

    const exportPdfHandler = async () => {
      if (!active) {
        return
      }

      save({
        title: t('contextmenu.editor_tab.export_pdf'),
        defaultPath: curFile.name.split('.')?.[0] + '.pdf',
      }).then(async (path) => {
        if (!path) return

        const n = toast.loading(t('contextmenu.editor_tab.export_pdf') + '...')

        html2canvas(document.getElementById(id) as HTMLElement).then((canvas) => {
          const data = canvasToPdfBytes(canvas)

          invoke('write_u8_array_to_file', { filePath: path, content: data })
            .then(() => {
              toast.dismiss(n)
              toast.success('Exported to ' + path)
            })
            .catch((error) => {
              toast.dismiss(n)
              toast.error(String(error))
            })
        }).catch((error) => {
          toast.dismiss(n)
          toast.error(String(error))
        })
      })
    }

    const exportHtmlHandler = async () => {
      if (!active) {
        return
      }

      save({
        title: t('contextmenu.editor_tab.export_html'),
        defaultPath: curFile.name.split('.')?.[0] + '.html',
      })
        .then(async (path) => {
          if (!path) return

          const n = toast.loading(t('contextmenu.editor_tab.export_html') + '...')
          const res = await editorRef.current?.exportHtml()
          const scStyled = document.head.querySelectorAll('style[data-styled]')

          const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
  ${scStyled[0].innerHTML}
  </style>
  </head>
  <body style="height: 100vh; overflow: auto;">
  <div class="${document.getElementById(id)?.className}">
  ${res}
  </div>
  </body>
  </html>
          `

          invoke('export_html_to_path', { str: html, path }).then(() => {
            toast.dismiss(n)
            toast.success('Exported to ' + path)
          })
        })
        .catch((error) => {
          toast.error(String(error))
        })
    }

    bus.on('editor_export_html', exportHtmlHandler)
    bus.on('editor_export_image', exportImageHandler)
    bus.on('editor_export_pdf', exportPdfHandler)
    bus.on('editor_set_content', setContentHandler)

    return () => {
      bus.detach('editor_export_html', exportHtmlHandler)
      bus.detach('editor_export_image', exportImageHandler)
      bus.detach('editor_export_pdf', exportPdfHandler)
      bus.detach('editor_set_content', setContentHandler)
    }
  }, [active, setContentHandler])

  useEffect(() => {
    if (active) {
      debounceRefreshToc()
    }
  }, [active, debounceRefreshToc])

  useEffect(() => {
    if (active) {
      const { addCommand } = useCommandStore.getState()
      addCommand({
        id: 'app_save',
        handler: () => {
          saveHandler()
        },
      })
    }
  }, [active, saveHandler])

  useEffect(() => {
    const callback = (hooks: SaveHandlerParams) => {
      if (!active) {
        return
      }
      saveHandler({ onSuccess: hooks?.onSuccess, onFinally: hooks?.onFinally })
    }

    bus.on(EVENT.app_save, callback)

    return () => {
      bus.detach(EVENT.app_save, callback)
    }
  }, [active, saveHandler])

  const handleWrapperClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (
        (e.target as HTMLElement)?.id === 'editorarea-wrapper' ||
        (e.target as HTMLElement).parentElement?.id === 'editorarea-wrapper'
      ) {
        delegate.manager.view.focus()
      }
    },
    [delegate.manager.view],
  )

  const editorProps: MfEditorProps = useMemo(
    () => ({
      initialType: fileTypeConfig?.defaultMode,
      content: content!,
      delegate,
      style: {
        height: '100%',
      },
      wysiwygTextContainerProps: {
        spellCheck: settingData.wysiwyg_editor_spellcheck,
      },
      sourceCodeTextContainerProps: {
        spellCheck: settingData.source_code_editor_spellcheck,
      },
      offset: { top: 10, left: 16 },
      styleToken: {
        id,
        rootFontSize: `${settingData.editor_root_font_size}px`,
        rootLineHeight: settingData.editor_root_line_height,
      },
      onContextMounted: (context: EditorContext) => {
        setEditorCtx(id, context)
      },
      delegateOptions: createWysiwygDelegateOptions(curFile.id),
      wysiwygToolBarOptions: {
        enable: false,
      },
      errorHandler: {
        onError(params) {
          if (params.error) {
            Sentry.captureException(params.error)
          }
        },
      },
    }),
    [content, delegate, setEditorCtx, id, active, settingData, fileTypeConfig],
  )

  const handleChange: EditorChangeHandler = useCallback(
    (params) => {
      const { tr, helpers } = params
      const { getCharacterCount, getWordCount } = helpers

      const characterCount = getCharacterCount()
      const wordCount = getWordCount()

      useEditorCounterStore.getState().addEditorCounter({
        id,
        data: {
          characterCount,
          wordCount,
        },
      })

      if (!active) return
      editorContextRef.current = params
      updateHeadingIndicator(params.state)

      if (tr?.docChanged && !tr.getMeta('APPLY_MARKS')) {
        const state = {
          hasUnsavedChanges: true,
          undoDepth: helpers.undoDepth(),
        }
        const { setIdStateMap } = useEditorStateStore.getState()

        setIdStateMap(id, state)
        debounceRefreshToc()
        const curFile = getFileObject(id)
        if (settingData.autosave && curFile?.path) {
          debounceSaveHandler()
        }
      }
    },
    [id, debounceSaveHandler, active, debounceRefreshToc, settingData, updateHeadingIndicator],
  )

  if (status === TextEditorStatus.NOTEXIST) {
    return <WarningHeader>File is not exist</WarningHeader>
  }

  if (typeof content !== 'string') {
    return null
  }

  const cls = classNames('markdown-body', {
    'editor-active': active,
  }, `editor-view-${editorViewType}`)

  return (
    <EditorWrapper
      ref={editorWrapperRef}
      id='editorarea-wrapper'
      className={cls}
      fullWidth={settingData.editor_full_width}
      active={active}
      onClick={handleWrapperClick}
    >
      {headingIndicator ? (
        <HeadingCursorIndicator $left={headingIndicator.left} $top={headingIndicator.top}>
          H{headingIndicator.level}
        </HeadingCursorIndicator>
      ) : null}
      <MfEditor ref={editorRef} onChange={handleChange} {...editorProps} />
    </EditorWrapper>
  )
}

export interface TextEditorProps {
  id: string
  active: boolean
  fileTypeConfig: FileTypeConfig
  onSave?: () => void
}

export default memo(TextEditor)
