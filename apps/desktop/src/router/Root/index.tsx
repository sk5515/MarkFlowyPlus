import { AppInfoDialog, SideBar } from '@/components'
import EditorArea from '@/components/EditorArea'
import { PageLayout } from '@/components/Layout'
import RightBar from '@/components/SideBar/RightBar'
import TitleBar from '@/components/TitleBar'
import { WorkspaceDialog } from '@/components/WorkspaceDialog'
import { BookMarkDialog } from '@/extensions/bookmarks/BookMarkDialog'
import useBookMarksStore from '@/extensions/bookmarks/useBookMarksStore'
import { useCommandInit } from '@/hooks/useCommandInit'
import { appInfoStoreSetup } from '@/services/app-info'
import { currentWindow } from '@/services/windows'
import useLayoutStore from '@/stores/useLayoutStore'
import { memo, useCallback, useEffect, useRef } from 'react'
import {
  Group,
  GroupImperativeHandle,
  Layout,
  Panel,
} from 'react-resizable-panels'
import { SettingDialog } from '../Setting/component/SettingDialog'
import { StyleSeparator } from './styles'

const DEFAULT_ROOT_LAYOUT: Layout = {
  'root-left': 20,
  'root-center': 60,
  'root-right': 20,
}
const LEGACY_RESIZE_PANEL_STORAGE_KEY = 'root-resize-panel'
const COLLAPSED_LAYOUT_THRESHOLD = 1
const SIDE_PANEL_MIN_SIZE = 15
const CENTER_PANEL_MIN_SIZE = 30
const RESTORE_RETRY_DELAYS = [0, 50, 150, 350, 700]
const BEFORE_MINIMIZE_EVENT = 'markflowy:before-minimize'

const isCollapsedSize = (size: number | undefined) => (
  size === undefined || size <= COLLAPSED_LAYOUT_THRESHOLD
)

const isInvalidMinimizedLayout = (layout: Layout | undefined) => {
  if (!layout) {
    return false
  }

  const leftSize = layout['root-left'] ?? 0
  const centerSize = layout['root-center'] ?? 0
  const rightSize = layout['root-right'] ?? 0

  return (
    leftSize <= COLLAPSED_LAYOUT_THRESHOLD &&
    rightSize <= COLLAPSED_LAYOUT_THRESHOLD &&
    centerSize >= 100 - COLLAPSED_LAYOUT_THRESHOLD * 2
  )
}

const hasCollapsedSidePanel = (layout: Layout | undefined) => {
  if (!layout) {
    return false
  }

  return isCollapsedSize(layout['root-left']) || isCollapsedSize(layout['root-right'])
}

function Root() {
  const groupElementRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<GroupImperativeHandle>(null)
  const shouldRestoreStableLayoutRef = useRef(false)
  const isRestoringWindowLayoutRef = useRef(false)
  const restoreTimersRef = useRef<number[]>([])

  const { setLeftBarVisible, setRightBarVisible } = useLayoutStore()

  const syncLayoutVisibleState = useCallback((layout: Layout) => {
    setLeftBarVisible(!isCollapsedSize(layout['root-left']))
    setRightBarVisible(!isCollapsedSize(layout['root-right']))
  }, [setLeftBarVisible, setRightBarVisible])

  const captureStableLayout = useCallback(() => {
    const layout = groupRef.current?.getLayout()
    isRestoringWindowLayoutRef.current = true
    if (layout) {
      if (hasCollapsedSidePanel(layout)) {
        shouldRestoreStableLayoutRef.current = true
        return
      }

      syncLayoutVisibleState(layout)
    }

    shouldRestoreStableLayoutRef.current = true
  }, [syncLayoutVisibleState])

  const restoreStableLayoutNow = useCallback(() => {
    const group = groupRef.current
    const groupElement = groupElementRef.current
    if (!shouldRestoreStableLayoutRef.current || !group || !groupElement || groupElement.offsetWidth === 0) {
      return
    }

    requestAnimationFrame(() => {
      const latestGroupElement = groupElementRef.current
      if (!latestGroupElement || latestGroupElement.offsetWidth === 0 || latestGroupElement.offsetHeight === 0) {
        return
      }

      const appliedLayout = group.setLayout(DEFAULT_ROOT_LAYOUT)
      if (!isInvalidMinimizedLayout(appliedLayout) && !hasCollapsedSidePanel(appliedLayout)) {
        shouldRestoreStableLayoutRef.current = false
        syncLayoutVisibleState(appliedLayout)
        window.setTimeout(() => {
          isRestoringWindowLayoutRef.current = false
        }, 1000)
      }
    })
  }, [syncLayoutVisibleState])

  const scheduleStableLayoutRestore = useCallback(() => {
    restoreTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    restoreTimersRef.current = RESTORE_RETRY_DELAYS.map((delay) => (
      window.setTimeout(restoreStableLayoutNow, delay)
    ))
  }, [restoreStableLayoutNow])

  const persistLayout = useCallback(
    (layout: Layout) => {
      const groupElement = groupElementRef.current
      const isLayoutFromHiddenWindow =
        document.visibilityState === 'hidden' ||
        !groupElement ||
        groupElement.offsetWidth === 0 ||
        groupElement.offsetHeight === 0

      if (isRestoringWindowLayoutRef.current || isLayoutFromHiddenWindow || hasCollapsedSidePanel(layout)) {
        shouldRestoreStableLayoutRef.current = true
        return
      }

      syncLayoutVisibleState(layout)
    },
    [syncLayoutVisibleState],
  )

  const { getBookMarkList } = useBookMarksStore()

  useCommandInit()

  useEffect(() => {
    appInfoStoreSetup()
    localStorage.removeItem(LEGACY_RESIZE_PANEL_STORAGE_KEY)
    setLeftBarVisible(true)
    setRightBarVisible(true)
  }, [])

  useEffect(() => {
    const restoreWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        scheduleStableLayoutRestore()
      }
    }

    document.addEventListener('visibilitychange', restoreWhenVisible)
    window.addEventListener(BEFORE_MINIMIZE_EVENT, captureStableLayout)
    window.addEventListener('focus', scheduleStableLayoutRestore)
    window.addEventListener('resize', scheduleStableLayoutRestore)
    window.addEventListener('pageshow', scheduleStableLayoutRestore)

    const unlistenFocusChanged = currentWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        scheduleStableLayoutRestore()
      }
    })

    const unlistenResized = currentWindow.onResized(async () => {
      if (!(await currentWindow.isMinimized())) {
        scheduleStableLayoutRestore()
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', restoreWhenVisible)
      window.removeEventListener(BEFORE_MINIMIZE_EVENT, captureStableLayout)
      window.removeEventListener('focus', scheduleStableLayoutRestore)
      window.removeEventListener('resize', scheduleStableLayoutRestore)
      window.removeEventListener('pageshow', scheduleStableLayoutRestore)
      restoreTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      unlistenFocusChanged.then((fn) => fn())
      unlistenResized.then((fn) => fn())
    }
  }, [captureStableLayout, scheduleStableLayoutRestore])

  useEffect(() => {
    getBookMarkList()
  }, [])

  return (
    <PageLayout>
      <TitleBar />
      <Group
        defaultLayout={DEFAULT_ROOT_LAYOUT}
        elementRef={groupElementRef}
        groupRef={groupRef}
        onLayoutChanged={persistLayout}
        style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--mf-bg-color)' }}
      >
        <Panel
          id='root-left'
          defaultSize={DEFAULT_ROOT_LAYOUT['root-left']}
          minSize={SIDE_PANEL_MIN_SIZE}
        >
          <SideBar />
        </Panel>
        <StyleSeparator />
        <Panel
          id='root-center'
          defaultSize={DEFAULT_ROOT_LAYOUT['root-center']}
          minSize={CENTER_PANEL_MIN_SIZE}
        >
          <EditorArea />
        </Panel>
        <StyleSeparator />
        <Panel
          id='root-right'
          defaultSize={DEFAULT_ROOT_LAYOUT['root-right']}
          minSize={SIDE_PANEL_MIN_SIZE}
        >
          <RightBar />
        </Panel>
      </Group>
      {/* global dialogs */}
      <AppInfoDialog />
      <BookMarkDialog />
      <SettingDialog />
      <WorkspaceDialog />
    </PageLayout>
  )
}

export default memo(Root)
