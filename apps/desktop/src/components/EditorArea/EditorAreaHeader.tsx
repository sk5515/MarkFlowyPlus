import { getSaveOpenedEditorEntries } from '@/helper/files'
import { checkUnsavedFiles } from '@/services/checkUnsavedFiles'
import { addEmptyEditorTab } from '@/services/editor-file'
import { useEditorStore } from '@/stores'
import { memo, type MouseEvent, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MfIconButton } from '../ui-v2/Button'
import { toggleContextMenu } from '../ui-v2/ContextMenu'

export const EditorAreaHeader = memo(() => {
  const { opened, activeId, delAllOpenedFile } = useEditorStore()
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  const closeAll = useCallback(() => {
    if (
      checkUnsavedFiles({
        fileIds: opened,
        onSaveAndClose: async (hasUnsavedFileIds) => {
          const saves = hasUnsavedFileIds.map((otherId) => getSaveOpenedEditorEntries(otherId))
          await Promise.all(saves.map((saveHandler) => saveHandler?.()))
          delAllOpenedFile()
        },
        onUnsavedAndClose: () => {
          delAllOpenedFile()
        },
      }) > 0
    ) {
      return
    }
    delAllOpenedFile()
  }, [delAllOpenedFile, opened])

  const preventMenuButtonClick = useCallback((event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
  }, [])

  const handleClick = useCallback((event?: MouseEvent<HTMLElement>) => {
    preventMenuButtonClick(event)

    const rect = ref.current?.getBoundingClientRect()
    if (rect === undefined) return

    toggleContextMenu({
      x: rect.x,
      y: rect.y + rect.height,
      items: [
        {
          label: t('contextmenu.editor_tab.close_all'),
          value: 'close_all',
          handler: closeAll,
        },
      ],
    })
  }, [closeAll, preventMenuButtonClick, t])

  return (
    <div className='editor-area-header'>
      <MfIconButton icon={'ri-add-line'} onClick={addEmptyEditorTab} />
      {activeId ? (
        <MfIconButton
          iconRef={ref}
          icon={'ri-more-fill'}
          tooltipProps={{ title: t('action.more') }}
          onMouseDown={handleClick}
          onClick={preventMenuButtonClick}
        />
      ) : null}
    </div>
  )
})
