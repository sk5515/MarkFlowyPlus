import styled, { css } from 'styled-components'

interface EditorWrapperProps {
  active: boolean
  fullWidth: boolean
}

export const EditorWrapper = styled.div.attrs<EditorWrapperProps>((props) => props)`
  flex: 1;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  display: grid;
  grid-template-columns: 1fr;

  > * {
    grid-column: 1;
    grid-row: 1;
  }

  ${(props) =>
    props.active
      ? css({
          maxWidth: 'none',
          width: '100%',
          paddingBottom: '3rem',
          ['--editor-content-max-width' as string]: props.fullWidth ? 'none' : '800px',
        })
      : css({
          display: 'none',
        })}

`

export const EditorToc = styled.div`
  position: sticky;
  right: 0;
  top: 0;
  height: 100%;
  overflow: hidden;
  z-index: 5;
  justify-self: end;
  align-self: start;
  margin: 12px 12px 0 0;
  pointer-events: auto;
`

interface HeadingCursorIndicatorProps {
  $left: number
  $top: number
}

export const HeadingCursorIndicator = styled.div.attrs<HeadingCursorIndicatorProps>((props) => ({
  style: {
    left: `${props.$left}px`,
    top: `${props.$top}px`,
  },
}))<HeadingCursorIndicatorProps>`
  position: fixed;
  z-index: 1000;
  transform: translateY(-50%);
  pointer-events: none;
  border: none;
  outline: none;
  box-shadow: none;
  background: transparent;
  color: ${(props) => props.theme.unselectedFontColor};
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
  user-select: none;
`
