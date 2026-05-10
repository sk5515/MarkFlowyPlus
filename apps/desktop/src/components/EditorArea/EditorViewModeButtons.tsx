import { emitEditorViewTypeSwitch } from '@/helper/editorViewTypeSwitch'
import { getFileObject } from '@/helper/files'
import { useEditorStore } from '@/stores'
import useEditorViewTypeStore from '@/stores/useEditorViewTypeStore'
import useFileTypeConfigStore from '@/stores/useFileTypeConfigStore'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorViewType } from 'rme'
import styled from 'styled-components'
import { MfIconButton } from '../ui-v2/Button'

export const EditorViewModeButtons = memo(() => {
  const { activeId } = useEditorStore()
  const { editorViewTypeMap } = useEditorViewTypeStore()
  const { t } = useTranslation()
  const curFile = activeId ? getFileObject(activeId) : undefined
  const editorViewType = editorViewTypeMap.get(curFile?.id || '') || EditorViewType.WYSIWYG
  const curFileTypeConfig = curFile
    ? useFileTypeConfigStore.getState().getFileTypeConfigById(curFile.id)
    : undefined
  const supportedModes = curFileTypeConfig?.supportedModes ?? []

  if (!curFile) {
    return null
  }

  const viewActions = [
    {
      mode: EditorViewType.SOURCECODE,
      icon: 'ri-code-s-slash-line',
      label: t('view.source_code'),
    },
    {
      mode: EditorViewType.WYSIWYG,
      icon: 'ri-edit-2-line',
      label: t('view.wysiwyg'),
    },
  ].filter((item) => supportedModes.includes(item.mode))

  return (
    <ViewModeGroup>
      {viewActions.map((item) => (
        <MfIconButton
          key={item.mode}
          icon={item.icon}
          size='small'
          rounded='smooth'
          active={editorViewType === item.mode}
          tooltipProps={{ title: item.label }}
          onClick={() => emitEditorViewTypeSwitch(item.mode)}
        />
      ))}
    </ViewModeGroup>
  )
})

const ViewModeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 2px;
  padding-left: 4px;
  border-left: 1px solid ${(props) => props.theme.borderColor};
`
