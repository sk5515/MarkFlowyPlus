import { emitEditorViewTypeSwitch } from '@/helper/editorViewTypeSwitch'
import { getFileObject } from '@/helper/files'
import { toggleEditorTypeShortcut } from '@/helper/keyboardShortcut'
import { useEditorStore } from '@/stores'
import useEditorViewTypeStore from '@/stores/useEditorViewTypeStore'
import useFileTypeConfigStore from '@/stores/useFileTypeConfigStore'
import { type MouseEvent, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorViewType } from 'rme'
import { MfIconButton } from '../../../../ui-v2/Button'
import { toggleContextMenu } from '../../../../ui-v2/ContextMenu'

export const ViewSwitcher = () => {
  const { activeId } = useEditorStore()
  const { editorViewTypeMap } = useEditorViewTypeStore()
  const { t } = useTranslation()
  const ref = useRef<any>(null)
  
  const curFile = activeId ? getFileObject(activeId) : undefined
  const editorViewType = editorViewTypeMap.get(curFile?.id || '') || 'wysiwyg'

  const viewTypeIconMap: Record<string, string> = {
    sourceCode: 'ri-code-s-slash-line',
    wysiwyg: 'ri-edit-2-line',
    preview: 'ri-eye-line',
  }

  const preventMenuButtonClick = useCallback((event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
  }, [])

  const handleViewClick = useCallback((event?: MouseEvent<HTMLElement>) => {
    preventMenuButtonClick(event)

    const rect = ref.current?.getBoundingClientRect()
    if (rect === undefined) return
    
    const { getFileTypeConfigById } = useFileTypeConfigStore.getState()
    const curFileTypeConfig = getFileTypeConfigById(curFile?.id || '')

    toggleContextMenu({
      x: rect.x,
      y: rect.y + rect.height,
      items: [
        {
          label: t('view.source_code'),
          value: EditorViewType.SOURCECODE,
          shortcut: toggleEditorTypeShortcut,
          checked: editorViewType === EditorViewType.SOURCECODE,
          handler: () => emitEditorViewTypeSwitch(EditorViewType.SOURCECODE),
        },
        {
          label: t('view.wysiwyg'),
          value: EditorViewType.WYSIWYG,
          shortcut: toggleEditorTypeShortcut,
          checked: editorViewType === EditorViewType.WYSIWYG,
          handler: () => emitEditorViewTypeSwitch(EditorViewType.WYSIWYG),
        },
        {
          label: t('view.preview'),
          value: EditorViewType.PREVIEW,
          checked: editorViewType === EditorViewType.PREVIEW,
          handler: () => emitEditorViewTypeSwitch(EditorViewType.PREVIEW),
        },
      ].filter((item) => {
        return curFileTypeConfig ? curFileTypeConfig?.supportedModes?.includes(item.value) : false
      }),
    })
  }, [curFile, editorViewType, preventMenuButtonClick, t])

  if (!curFile) return null

  return (
    <MfIconButton
      size='small'
      rounded='smooth'
      iconRef={ref}
      icon={viewTypeIconMap[editorViewType]}
      onMouseDown={handleViewClick}
      onClick={preventMenuButtonClick}
    />
  )
}
