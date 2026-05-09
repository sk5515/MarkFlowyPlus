import { TaskList } from '@/components/TaskList/TaskList'
import { currentWindow } from '@/services/windows'
import { useEffect, useState, type MouseEvent } from 'react'
import { EditorCount } from '../StatusBar/EditorCount'
import { LayoutLeftBtn, LayoutRightBtn } from '../StatusBar/LayoutBtn'
import { CenterMenu } from '../StatusBar/SettingBtn'
import { WorkspaceBtn } from '../StatusBar/WorkspaceBtn'
import {
  CenterDragRegion,
  Container,
  LeftContainer,
  RightContainer,
  WindowControlButton,
  WindowControls,
} from './styled'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    currentWindow.isMaximized().then(setMaximized)
    const unlisten = currentWindow.onResized(() => {
      currentWindow.isMaximized().then(setMaximized)
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  const startDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (event.detail > 1) {
      return
    }
    currentWindow.startDragging()
  }

  const toggleMaximize = async () => {
    await currentWindow.toggleMaximize()
    setMaximized(await currentWindow.isMaximized())
  }

  return (
    <Container>
      <LeftContainer>
        <CenterMenu />
        <WorkspaceBtn />
      </LeftContainer>

      <CenterDragRegion onMouseDown={startDrag} onDoubleClick={toggleMaximize} />

      <RightContainer>
        <TaskList />
        <EditorCount />
        <LayoutLeftBtn />
        <LayoutRightBtn />
      </RightContainer>

      <WindowControls>
        <WindowControlButton aria-label='Minimize' onClick={() => currentWindow.minimize()}>
          <i className='ri-subtract-line' />
        </WindowControlButton>
        <WindowControlButton aria-label='Maximize' onClick={toggleMaximize}>
          <i className={maximized ? 'ri-checkbox-multiple-blank-line' : 'ri-checkbox-blank-line'} />
        </WindowControlButton>
        <WindowControlButton
          aria-label='Close'
          variant='close'
          onClick={() => currentWindow.close()}
        >
          <i className='ri-close-line' />
        </WindowControlButton>
      </WindowControls>
    </Container>
  )
}
