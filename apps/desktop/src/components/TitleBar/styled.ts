import styled from 'styled-components'

export const Container = styled.div`
  flex: 0 0 auto;
  height: 34px;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaceSm};
  padding-left: 8px;
  background: ${(props) => props.theme.statusBarBgColor};
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  color: ${(props) => props.theme.primaryFontColor};
  user-select: none;
  font-size: 0.8rem;
`

export const LeftContainer = styled.div<{ $isMacOS?: boolean }>`
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaceSm};
  height: 100%;
  padding-left: ${(props) => props.$isMacOS ? '74px' : '0'};
`

export const CenterDragRegion = styled.div`
  flex: 1 1 auto;
  align-self: stretch;
  min-width: 24px;
`

export const RightContainer = styled.div`
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${(props) => props.theme.spaceSm};
  height: 100%;
  overflow: hidden;
`

export const WindowControls = styled.div<{ $isMacOS?: boolean }>`
  flex: 0 0 auto;
  display: ${(props) => props.$isMacOS ? 'none' : 'flex'};
  align-items: stretch;
  align-self: stretch;
  margin-left: 4px;
`

export const WindowControlButton = styled.button<{ variant?: 'close' }>`
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  cursor: default;
  font-size: 0.9rem;
  line-height: 1;

  &:hover {
    background: ${(props) => props.variant === 'close' ? '#c42b1c' : props.theme.hoverColor};
    color: ${(props) => props.variant === 'close' ? '#fff' : 'inherit'};
  }
`
