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

const CountTag = styled.span`
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.hoverColor};
  color: ${({ theme }) => theme.labelFontColor};
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
`

export const FindInput: FC<{
  query: string
  setQuery: (query: string) => void
  onFind: () => void
  total: number
  activeIndex?: number | null
}> = ({ query, setQuery, onFind, total, activeIndex }) => {
  const counterLabel = `${total && activeIndex != null ? activeIndex + 1 : 0} of ${total}`

  return (
    <StyledInput
      placeholder='Find'
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      onPressEnter={onFind}
      size='small'
      prefix={<i className='ri-search-line' />}
      suffix={<CountTag>{counterLabel}</CountTag>}
    />
  )
}
