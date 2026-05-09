import { MfIconLabelButton } from '@/components/ui-v2/Button/icon-label-button'
import bus from '@/helper/eventBus'
import { getFileObject } from '@/helper/files'
import { toggleEditorTypeShortcut } from '@/helper/keyboardShortcut'
import { useEditorStore } from '@/stores'
import useEditorViewTypeStore from '@/stores/useEditorViewTypeStore'
import useFileTypeConfigStore from '@/stores/useFileTypeConfigStore'
import { memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorViewType } from 'rme'
import { showContextMenu } from '../../../../ui-v2/ContextMenu'

export const MenuButton = memo(() => {
  const { activeId } = useEditorStore()
  const { editorViewTypeMap } = useEditorViewTypeStore()
  const { t } = useTranslation()
  const ref = useRef<any>(null)

  const curFile = activeId ? getFileObject(activeId) : undefined
  const editorViewType = editorViewTypeMap.get(curFile?.id || '') || 'wysiwyg'

  const handleMenuClick = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect === undefined) return

    const { getFileTypeConfigById } = useFileTypeConfigStore.getState()
    const curFileTypeConfig = getFileTypeConfigById(curFile?.id || '')

    showContextMenu({
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
  }, [curFile, editorViewType, t])

  if (!curFile) return null

  return (
    <MfIconLabelButton
      iconRef={ref}
      icon={'ri-menu-line'}
      onClick={handleMenuClick}
      tooltipProps={{ title: t('action.more') }}
      label={t('common.menu')}
    />
  )
})
