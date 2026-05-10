import styled from 'styled-components'

export const Container = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;

  .editor-area-header {
    display: flex;
    flex: initial;
    align-items: center;
    justify-content: flex-end;
    box-sizing: border-box;
    z-index: 10;
    border-bottom: 1px solid ${(props) => props.theme.borderColor};
    border-left: 1px solid ${(props) => props.theme.borderColor};
  }

  .code-contents {
    flex: 1;
    min-width: 0;
    display: flex;
    overflow-x: hidden;
  }
`

export const TabItem = styled.div<TabItemProps>`
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  align-items: center;
  position: relative;
  top: 1px;
  padding-left: ${(props) => props.theme.spaceXl};
  padding-right: ${(props) => props.theme.spaceXs};
  font-size: ${(props) => props.theme.fontXs};
  background-color: ${(props) =>
    props.active ? props.theme.editorTabActiveBgColor : props.theme.editorTabBgColor};
  color: ${(props) => (props.active ? props.theme.primaryFontColor : props.theme.labelFontColor)};
  border-bottom: 2px solid
    ${(props) => (props.active ? props.theme.editorTabActiveBgColor : props.theme.borderColor)};
  border-left: 0 !important;
  outline: none;
  box-shadow: none;
  box-sizing: border-box;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Edge, IE */

  &::before,
  &::after {
    display: none !important;
    content: none !important;
  }

  &:focus,
  &:focus-visible,
  &:active {
    border-left: 0 !important;
    outline: none;
    box-shadow: none;
  }

  .tab-title {
    max-width: 160px;
    min-width: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .close {
    flex: 0 0 auto;
    cursor: pointer;
    opacity: 0;
  }

  &:hover {
    .close {
      opacity: 1;
    }
  }
`

type DotProps = {
  color?: string
}

export const Dot = styled.div<DotProps>`
  position: relative;
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: transparent;
  margin: 0 0.25rem;
  cursor: pointer;

  &::before {
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${(props) => props.color || props.theme.warnColor};
    content: '';
  }

  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }
`

interface TabItemProps {
  active: boolean
}

export const WarningHeader = styled.h3`
  text-align: center;
  color: ${(props) => props.theme.dangerColor};
`

export const EditorPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`
