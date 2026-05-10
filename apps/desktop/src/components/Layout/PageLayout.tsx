import styled from "styled-components"

export const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  border-top: 1px solid ${props => props.theme.borderColor};
  background-color: ${props => props.theme.bgColor};
  color: ${props => props.theme.primaryFontColor};
`
