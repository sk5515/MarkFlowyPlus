import type { FC } from 'react'
import styled from 'styled-components'

const ButtonGroup = styled.div`
  display: flex;
  gap: 5px;
  column-gap: 5px;
  flex: 0 0 auto;

  > * + * {
    margin-left: 5px;
  }
`

const ActionButton = styled.button`
  height: 28px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 6px;
  background-color: transparent;
  color: ${({ theme }) => theme.primaryFontColor};
  font-size: ${({ theme }) => theme.fontXs};
  white-space: nowrap;
  cursor: pointer;
  outline: none;

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.hoverColor};
    border-color: ${({ theme }) => theme.accentColor};
  }
`

export const ReplaceController: FC<{
  replace: () => void
  replaceAll: () => void
}> = ({ replace, replaceAll }) => {
  return (
    <ButtonGroup>
      <ActionButton type='button' onClick={replace}>
        Replace
      </ActionButton>
      <ActionButton type='button' onClick={replaceAll}>
        All
      </ActionButton>
    </ButtonGroup>
  )
}
