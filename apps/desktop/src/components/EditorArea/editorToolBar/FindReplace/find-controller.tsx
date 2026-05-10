import type { FC } from 'react'
import styled from 'styled-components'

const ButtonGroup = styled.div`
  display: flex;
  gap: 5px;
  column-gap: 5px;
  flex: 0 0 auto;
  padding-left: 0;

  > * + * {
    margin-left: 5px;
  }
`

const IconButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  padding: 0;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.accentColor : theme.borderColor)};
  border-radius: 6px;
  background-color: ${({ theme, $active }) => ($active ? theme.accentColorFocused : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.accentColor : theme.primaryFontColor)};
  cursor: pointer;
  outline: none;

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.hoverColor};
    border-color: ${({ theme }) => theme.accentColor};
  }

  i {
    font-size: 16px;
    line-height: 1;
  }
`

export const FindController: FC<{
  findPrev: () => void
  findNext: () => void
  stopFind: () => void
  caseSensitive: boolean
  toggleCaseSensitive: () => void
  onDismiss?: () => void
}> = ({ findPrev, findNext, stopFind, caseSensitive, toggleCaseSensitive, onDismiss }) => (
  <ButtonGroup>
    <IconButton type='button' onClick={findPrev}>
      <i className='ri-arrow-left-s-line' />
    </IconButton>
    <IconButton type='button' onClick={findNext}>
      <i className='ri-arrow-right-s-line' />
    </IconButton>
    <IconButton type='button' $active={caseSensitive} onClick={toggleCaseSensitive}>
      <i className='ri-font-size' />
    </IconButton>
    <IconButton
      type='button'
      onClick={() => {
        stopFind()
        onDismiss?.()
      }}
    >
      <i className='ri-close-line' />
    </IconButton>
  </ButtonGroup>
)
