import styled from 'styled-components'

export const Container = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
  font-size: 0.8rem;

  .explorer-tree-root {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }

  .border-t-1-solid {
    border-top: 1px solid ${(props) => props.theme.borderColor};
  }

  .border-b-1-solid {
    border-bottom: 1px solid ${(props) => props.theme.borderColor};
  }
`
