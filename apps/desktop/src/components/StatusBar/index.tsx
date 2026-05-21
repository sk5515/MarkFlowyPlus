import { TaskList } from '../TaskList/TaskList'
import { EditorCount } from './EditorCount'
import { CenterMenu } from './SettingBtn'
import { Container, LeftContainer, RightContainer } from './styled'
import { WorkspaceBtn } from './WorkspaceBtn'

export default function StatusBar() {
  return (
    <Container>
      <LeftContainer>
        <CenterMenu />
        <WorkspaceBtn />
      </LeftContainer>
      <RightContainer>
        <TaskList />
        <EditorCount />
      </RightContainer>
    </Container>
  )
}
