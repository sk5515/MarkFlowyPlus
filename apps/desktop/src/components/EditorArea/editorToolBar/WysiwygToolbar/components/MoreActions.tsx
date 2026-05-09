import bus from '@/helper/eventBus'
import { getFileObject } from '@/helper/files'
import { useEditorStore } from '@/stores'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MfIconButton } from '../../../../ui-v2/Button'
import { showContextMenu } from '../../../../ui-v2/ContextMenu'

export const MoreActions = () => {
  const { activeId } = useEditorStore()
  const { t } = useTranslation()
  const ref = useRef<any>(null)
  
  const curFile = activeId ? getFileObject(activeId) : undefined

  const handleMoreAction = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect()
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

  if (!curFile) return null

  return (
    <MfIconButton
      size='small'
      rounded='smooth'
      iconRef={ref}
      icon={'ri-more-fill'}
      onClick={handleMoreAction}
    />
  )
}
