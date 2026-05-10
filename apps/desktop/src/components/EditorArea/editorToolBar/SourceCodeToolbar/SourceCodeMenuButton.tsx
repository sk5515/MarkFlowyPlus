import { MfIconLabelButton } from '@/components/ui-v2/Button/icon-label-button'
import { toggleContextMenu } from '@/components/ui-v2/ContextMenu'
import { emitEditorViewTypeSwitch } from '@/helper/editorViewTypeSwitch'
import bus from '@/helper/eventBus'
import { getFileObject } from '@/helper/files'
import { toggleEditorTypeShortcut } from '@/helper/keyboardShortcut'
import { useEditorStore } from '@/stores'
import useEditorViewTypeStore from '@/stores/useEditorViewTypeStore'
import useFileTypeConfigStore from '@/stores/useFileTypeConfigStore'
import { memo, type MouseEvent, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorViewType } from 'rme'

export const SourceCodeMenuButton = memo(() => {
  const { activeId } = useEditorStore()
  const { editorViewTypeMap } = useEditorViewTypeStore()
  const { t } = useTranslation()
  const ref = useRef<any>(null)

  const curFile = activeId ? getFileObject(activeId) : undefined
  const editorViewType = editorViewTypeMap.get(curFile?.id || '') || 'wysiwyg'

  const preventMenuButtonClick = useCallback((event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
  }, [])

  const handleMenuClick = useCallback((event?: MouseEvent<HTMLElement>) => {
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
          label: t('view.label'),
          value: 'view_switcher',
          children: [
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
          ].filter((item) => {
            return curFileTypeConfig
              ? curFileTypeConfig?.supportedModes?.includes(item.value)
              : false
          }),
        },
        {
          type: 'divider' as const,
        },
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
  }, [curFile, editorViewType, preventMenuButtonClick, t])

  if (!curFile) return null

  return (
    <MfIconLabelButton
      size='small'
      rounded='smooth'
      iconRef={ref}
      icon={'ri-menu-line'}
      onMouseDown={handleMenuClick}
      onClick={preventMenuButtonClick}
      tooltipProps={{ title: t('action.more') }}
      label={t('common.menu')}
    />
  )
})
