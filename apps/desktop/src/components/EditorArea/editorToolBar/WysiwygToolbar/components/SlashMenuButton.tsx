import { MfIconButton } from '@/components/ui-v2/Button'
import { openSlashMenu } from '@/helper/openSlashMenu'
import { FC, useCallback } from 'react'
import type { EditorContext } from 'rme'

interface SlashMenuButtonProps {
  editorCtx: EditorContext
  label: string
}

export const SlashMenuButton: FC<SlashMenuButtonProps> = ({ editorCtx, label }) => {
  const handleClick = useCallback(() => {
    openSlashMenu(editorCtx.view)
  }, [editorCtx])

  return (
    <MfIconButton
      icon='ri-add-box-line'
      onClick={handleClick}
      tooltipProps={{ title: label }}
      size='small'
      rounded='smooth'
    />
  )
}
