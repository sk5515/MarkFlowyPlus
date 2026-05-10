import { MfIconButton } from '@/components/ui-v2/Button'
import { useCommandStore } from '@/stores'
import { FC, useCallback } from 'react'

export const SearchToolbarButton: FC<{ label: string }> = ({ label }) => {
  const { execute } = useCommandStore()

  const handleClick = useCallback(() => {
    execute('app_findReplaceEditor')
  }, [execute])

  return (
    <MfIconButton
      icon='ri-search-line'
      onClick={handleClick}
      tooltipProps={{ title: label }}
      size='small'
      rounded='smooth'
    />
  )
}
