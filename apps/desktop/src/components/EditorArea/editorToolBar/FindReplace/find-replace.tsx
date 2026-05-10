import { useCommandStore, useEditorStore } from '@/stores'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { FindReplaceComponent } from './find-replace-component'

function useFindReplaceOpen() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { addCommand, execute } = useCommandStore()
  
  useEffect(() => {
    addCommand({
      id: 'app_findReplaceEditor',
      handler: () => {
        setOpen((prev) => {
          if (!prev) {
            execute('app_stopFindEditor')
          }
          return !prev
        })
      }
    })
  }, [addCommand, execute])

  const focus = useCallback(() => {
    const input = ref.current?.querySelector('input')
    if (input && document.activeElement !== input) {
      input.focus()
      return true
    }
    return false
  }, [])

  useEffect(() => {
    if (open) {
      focus()
    }
  }, [focus, open])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  return { open, ref, close }
}

const FindReplaceWrapper = styled.div`
  position: absolute;
  top: 76px;
  right: 16px;
  z-index: 30;
  width: min(560px, calc(100% - 32px));
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bgColor};
  box-shadow: 0 10px 30px ${({ theme }) => theme.boxShadowColor};
  backdrop-filter: blur(10px);
`

export const FindReplace: FC = () => {
  const { open, ref, close } = useFindReplaceOpen()
  const { editorCtxMap, activeId } = useEditorStore()

  const editorCtx = editorCtxMap.get(activeId ?? '')

  if (!open || !editorCtx || !editorCtx.helpers.findRanges) return null

  return (
    <FindReplaceWrapper ref={ref}>
      <FindReplaceComponent onDismiss={close} editorCtx={editorCtx} />
    </FindReplaceWrapper>
  )
}
