import classNames from 'classnames'
import styled from 'styled-components'
import type { TooltipProps } from 'zens'
import { Tooltip } from 'zens'

interface MfIconLabelButtonProps {
  icon: string
  label?: string
  className?: string
  onClick: (e?: React.MouseEvent<HTMLElement>) => void
  onMouseDown?: (e?: React.MouseEvent<HTMLElement>) => void
  iconRef?: React.RefObject<any>
  tooltipProps?: Omit<TooltipProps, 'children'> & {
    style?: React.CSSProperties
  }
  disabled?: boolean
  unselected?: boolean
  active?: boolean
  size?: 'small' | 'medium' | 'large'
  rounded?: 'smooth' | 'rounded' | 'square'
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: ${(props) => props.theme.smallBorderRadius};
  font-size: ${(props) => props.theme.fontXs};
  gap: 4px;
  cursor: pointer;
  color: ${(props) => props.theme.primaryFontColor};
  outline: none;
  box-shadow: none;
  transition: none;
  -webkit-tap-highlight-color: transparent;

  &:focus,
  &:focus-visible,
  &:active {
    outline: none;
    box-shadow: none;
  }

  &:hover {
    color: ${(props) => props.theme.accentColor};
    background-color: ${(props) => props.theme.hoverColor};
  }

  .btn-icon {
    font-size: 1rem;
  }
`
export const MfIconLabelButton = (props: MfIconLabelButtonProps) => {
  const {
    label,
    onClick,
    onMouseDown,
    tooltipProps,
    iconRef,
    disabled = false,
    icon,
  } = props

  const iconCls = classNames('btn-icon', icon)

  const content = (
    <Wrapper onMouseDown={disabled ? undefined : onMouseDown} onClick={disabled ? undefined : onClick}>
      <i ref={iconRef} className={iconCls}></i>
      {label && <span className='icon-label'>{label}</span>}
    </Wrapper>
  )

  if (tooltipProps) {
    return (
      <Tooltip style={{ zIndex: 11 }} {...tooltipProps}>
        {content}
      </Tooltip>
    )
  }

  return content
}
