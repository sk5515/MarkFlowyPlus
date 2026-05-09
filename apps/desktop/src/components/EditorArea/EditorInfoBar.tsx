import bus from '@/helper/eventBus'
import { getFileObject } from '@/helper/files'
import { toggleEditorTypeShortcut } from '@/helper/keyboardShortcut'
import { isEmptyEditor } from '@/services/editor-file'
import { currentWindow } from '@/services/windows'
import { getWorkspace, WorkSpace } from '@/services/workspace'
import { useEditorStateStore, useEditorStore } from '@/stores'
import useEditorViewTypeStore from '@/stores/useEditorViewTypeStore'
import useFileTypeConfigStore from '@/stores/useFileTypeConfigStore'
import NiceModal from '@ebay/nice-modal-react'
import { invoke } from '@tauri-apps/api/core'
import { debounce } from 'lodash'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorViewType } from 'rme'
import styled from 'styled-components'
import { Space, toast } from 'zens'
import { MODAL_INFO_ID } from '../Modal'
import { MfIconButton } from '../ui-v2/Button'
import { showContextMenu } from '../ui-v2/ContextMenu'

type FileNormalInfo = {
  size: string
  last_modified: string
}
const EMPTY_FILE_NORMAL_INFO: FileNormalInfo = {
  size: '',
  last_modified: '',
}

export const EditorInfoBar = memo(() => {
  const { activeId, folderData } = useEditorStore()
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null)

  const { editorViewTypeMap } = useEditorViewTypeStore()
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const ref1 = useRef<HTMLDivElement>(null)
  const curFile = activeId ? getFileObject(activeId) : undefined
  const [fileNormalInfo, setFileNormalInfo] = useState<FileNormalInfo>(EMPTY_FILE_NORMAL_INFO)
  const { idStateMap } = useEditorStateStore()
  const editorState = activeId ? idStateMap.get(activeId) : undefined

  useEffect(() => {
    getWorkspace().then((workspace) => {
      setWorkspace(workspace)
    })
  }, [folderData])

  const getFileNormalInfo = useCallback(
    debounce(async () => {
      if (!curFile?.path) {
        setFileNormalInfo(EMPTY_FILE_NORMAL_INFO)
        return
      }

      try {
        const res = await invoke<FileNormalInfo>('get_file_normal_info', {
          path: curFile.path,
        })

        setFileNormalInfo(res)
      } catch (error: unknown) {
        toast.error((error as Error).message)
      }
    }, 500),
    [curFile],
  )

  useEffect(() => {
    getFileNormalInfo()
  }, [editorState?.hasUnsavedChanges, getFileNormalInfo])

  useEffect(() => {
    const unsubscribe = currentWindow.listen<{
      paths: string[]
    }>('file_watcher_event', async (res) => {
      if (!curFile?.path) {
        return
      }
      if (Array.isArray(res.payload?.paths) && res.payload.paths.includes(curFile.path)) {
        getFileNormalInfo()
      }
    })

    return () => {
      unsubscribe.then((f) => f())
    }
  }, [workspace?.syncMode, getFileNormalInfo])

  const handleMoreAction = useCallback(() => {
    const rect = ref1.current?.getBoundingClientRect()
    if (rect === undefined) return

    showContextMenu({
      x: rect.x,
      y: rect.y + rect.height,
      items: [
        {
          value: 'export_html',
          label: t('contextmenu.editor_tab.export_html'),
          handler: () => {
            bus.emit('editor_export_html')
          },
        },
        {
          value: 'export_image',
          label: t('contextmenu.editor_tab.export_image'),
          handler: () => {
            bus.emit('editor_export_image')
          },
        },
        {
          value: 'export_pdf',
          label: t('contextmenu.editor_tab.export_pdf'),
          handler: () => {
            bus.emit('editor_export_pdf')
          },
        },
      ],
    })
  }, [curFile, t])

  const handleViewClick = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect === undefined) return
    const editorViewType = editorViewTypeMap.get(curFile?.id || '') || 'wysiwyg'
    const { getFileTypeConfigById } = useFileTypeConfigStore.getState()
    const curFileTypeConfig = getFileTypeConfigById(curFile?.id || '')

    showContextMenu({
      x: rect.x,
      y: rect.y + rect.height,
      items: [
        {
          label: t('view.source_code'),
          value: EditorViewType.SOURCECODE,
          shortcut: toggleEditorTypeShortcut,
          checked: editorViewType === EditorViewType.SOURCECODE,
          handler: () => bus.emit('editor_toggle_type', EditorViewType.SOURCECODE),
        },
        {
          label: t('view.wysiwyg'),
          value: EditorViewType.WYSIWYG,
          shortcut: toggleEditorTypeShortcut,
          checked: editorViewType === EditorViewType.WYSIWYG,
          handler: () => bus.emit('editor_toggle_type', EditorViewType.WYSIWYG),
        },
        {
          label: t('view.preview'),
          value: EditorViewType.PREVIEW,
          checked: editorViewType === EditorViewType.PREVIEW,
          handler: () => bus.emit('editor_toggle_type', EditorViewType.PREVIEW),
        },
      ].filter((item) => {
        return curFileTypeConfig ? curFileTypeConfig?.supportedModes?.includes(item.value) : false
      }),
    })
  }, [curFile, editorViewTypeMap, t])

  const editorViewType = editorViewTypeMap.get(curFile?.id || '') || 'wysiwyg'

  const viewTypeIconMap = {
    sourceCode: 'ri-code-s-slash-line',
    wysiwyg: 'ri-edit-2-line',
    preview: 'ri-eye-line',
  }

  if (!activeId || !curFile || isEmptyEditor(curFile.id)) return null

  return (
    <Container>
      {fileNormalInfo.last_modified ? (
        <Space>
          <span>
            {t('file.lastModified')}: {fileNormalInfo.last_modified}
          </span>
          <MfIconButton
            size='small'
            rounded='smooth'
            icon='ri-file-info-line'
            onClick={() => {
              NiceModal.show(MODAL_INFO_ID, {
                title: t('file.info'),
                width: '600px',
                content: (
                  <Space direction='vertical'>
                    <span>
                      {t('file.lastModified')}: {fileNormalInfo.last_modified}
                    </span>
                    <span>
                      {t('file.size')}: {fileNormalInfo.size}
                    </span>
                    <span>
                      {t('file.path')}: {curFile.path}
                    </span>
                  </Space>
                ),
              })
            }}
          />
        </Space>
      ) : (
        <div />
      )}

      <Space>
        <MfIconButton
          size='small'
          rounded='smooth'
          iconRef={ref}
          icon={viewTypeIconMap[editorViewType]}
          onClick={handleViewClick}
        />
        <MfIconButton
          size='small'
          rounded='smooth'
          iconRef={ref1}
          icon={'ri-more-fill'}
          onClick={handleMoreAction}
        />
      </Space>
    </Container>
  )
})

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: ${(props) => props.theme.fontXs};
  background-color: ${(props) => props.theme.bgColor};
`
