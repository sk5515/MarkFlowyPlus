import { TaskList } from '@/components/TaskList/TaskList'
import { EditorViewModeButtons } from '@/components/EditorArea/EditorViewModeButtons'
import { currentWindow } from '@/services/windows'
import { useEffect, useState, type MouseEvent } from 'react'
import { EditorCount } from '../StatusBar/EditorCount'
import { CenterMenu } from '../StatusBar/SettingBtn'
import {
  CenterDragRegion,
  Container,
  LeftContainer,
  RightContainer,
  WindowControlButton,
  WindowControls,
} from './styled'

const isMacOS =
  typeof navigator !== 'undefined' &&
  (/Mac|iP(hone|[oa]d)/.test(navigator.platform) ||
    /macintosh|mac os x/i.test(navigator.userAgent))

const BEFORE_MINIMIZE_EVENT = 'markflowy:before-minimize'

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

  const minimize = () => {
    window.dispatchEvent(new Event(BEFORE_MINIMIZE_EVENT))
    currentWindow.minimize()
  }

  return (
    <Container>
      <LeftContainer $isMacOS={isMacOS}>
        <CenterMenu />
        <EditorViewModeButtons />
      </LeftContainer>

      <CenterDragRegion onMouseDown={startDrag} onDoubleClick={toggleMaximize} />

      <RightContainer>
        <TaskList />
        <EditorCount />
      </RightContainer>

      <WindowControls $isMacOS={isMacOS}>
        <WindowControlButton aria-label='Minimize' onClick={minimize}>
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
