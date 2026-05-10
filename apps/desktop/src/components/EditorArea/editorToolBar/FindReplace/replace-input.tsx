import { Input } from 'antd'
import type { FC } from 'react'
import styled from 'styled-components'

const StyledInput = styled(Input)`
  height: 28px;
  border-color: ${({ theme }) => theme.borderColor};
  border-radius: 6px;
  background-color: ${({ theme }) => theme.buttonBgColor};
  color: ${({ theme }) => theme.primaryFontColor};
  box-shadow: none;

  &:hover,
  &:focus,
  &.ant-input-affix-wrapper-focused {
    border-color: ${({ theme }) => theme.accentColor};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentColorFocused};
  }

  .ant-input {
    background: transparent;
    color: inherit;
    font-size: ${({ theme }) => theme.fontXs};
  }

  .ant-input::placeholder {
    color: ${({ theme }) => theme.labelFontColor};
  }
`

export const ReplaceInput: FC<{
  replacement: string
  setReplacement: (query: string) => void
}> = ({ replacement, setReplacement }) => (
  <StyledInput
    placeholder='Replace'
    value={replacement}
    onChange={(event) => setReplacement(event.target.value)}
    size='small'
    prefix={<i className='ri-edit-line' />}
  />
)
