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
import { useCommandStore } from '@/stores'
import useLayoutStore from '@/stores/useLayoutStore'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Group,
  GroupImperativeHandle,
  Layout,
  Panel,
  PanelImperativeHandle,
  useDefaultLayout,
} from 'react-resizable-panels'
import { SettingDialog } from '../Setting/component/SettingDialog'
import { StyleSeparator } from './styles'

export const RESIZE_PANEL_STORAGE_KEY = 'root-resize-panel'
const ROOT_RESIZE_PANEL_IDS = ['root-left', 'root-center', 'root-right']
const DEFAULT_ROOT_LAYOUT: Layout = {
  'root-left': 20,
  'root-center': 60,
  'root-right': 20,
}
const COLLAPSED_LAYOUT_THRESHOLD = 1
const RESTORE_RETRY_DELAYS = [0, 50, 150, 350, 700]
const BEFORE_MINIMIZE_EVENT = 'markflowy:before-minimize'

const isCollapsedSize = (size: number | undefined) => (
  size === undefined || size <= COLLAPSED_LAYOUT_THRESHOLD
)

const normalizeOpenLayout = (layout: Layout | undefined, fallback: Layout = DEFAULT_ROOT_LAYOUT) => {
  const leftSize = isCollapsedSize(layout?.['root-left'])
    ? fallback['root-left']
    : layout!['root-left']
  const rightSize = isCollapsedSize(layout?.['root-right'])
    ? fallback['root-right']
    : layout!['root-right']

  if (leftSize + rightSize >= 100) {
    return DEFAULT_ROOT_LAYOUT
  }

  return {
    'root-left': leftSize,
    'root-center': 100 - leftSize - rightSize,
    'root-right': rightSize,
  }
}

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

function Root() {
  const [groupRevision, setGroupRevision] = useState(0)
  const [restoredLayout, setRestoredLayout] = useState<Layout | undefined>()
  const groupElementRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<GroupImperativeHandle>(null)
  const lastStableLayoutRef = useRef<Layout>(DEFAULT_ROOT_LAYOUT)
  const lastOpenLayoutRef = useRef<Layout>(DEFAULT_ROOT_LAYOUT)
  const shouldRestoreStableLayoutRef = useRef(false)
  const allowCollapsedLayoutSaveRef = useRef(false)
  const restoreTimersRef = useRef<number[]>([])
  const layoutStorage = useMemo(
    () => ({
      getItem: (key: string) => {
        const value = localStorage.getItem(key)
        if (!value) {
          return value
        }

        try {
          const layout = JSON.parse(value) as Layout
          return JSON.stringify(normalizeOpenLayout(layout))
        } catch {
          return value
        }
      },
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
    }),
    [],
  )
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: RESIZE_PANEL_STORAGE_KEY,
    panelIds: ROOT_RESIZE_PANEL_IDS,
    storage: layoutStorage,
  })

  const { setLeftBarVisible, setRightBarVisible } = useLayoutStore()
  const leftPanelRef = useRef<PanelImperativeHandle>(null)
  const rightPanelRef = useRef<PanelImperativeHandle>(null)

  useEffect(() => {
    if (defaultLayout) {
      const openLayout = normalizeOpenLayout(defaultLayout)
      lastStableLayoutRef.current = openLayout
      lastOpenLayoutRef.current = openLayout
    }
  }, [defaultLayout])

  const syncLayoutVisibleState = useCallback((layout: Layout) => {
    setLeftBarVisible(layout['root-left'] > 0)
    setRightBarVisible(layout['root-right'] > 0)
  }, [setLeftBarVisible, setRightBarVisible])

  const captureStableLayout = useCallback(() => {
    const layout = groupRef.current?.getLayout()
    if (layout) {
      const openLayout = normalizeOpenLayout(layout, lastOpenLayoutRef.current)
      lastStableLayoutRef.current = layout
      lastOpenLayoutRef.current = openLayout
      onLayoutChanged(openLayout)
      syncLayoutVisibleState(layout)
    }

    shouldRestoreStableLayoutRef.current = true
  }, [onLayoutChanged, syncLayoutVisibleState])

  const restoreStableLayoutNow = useCallback(() => {
    const group = groupRef.current
    const groupElement = groupElementRef.current
    if (!shouldRestoreStableLayoutRef.current || !group || !groupElement || groupElement.offsetWidth === 0) {
      return
    }

    const layout = lastStableLayoutRef.current
    requestAnimationFrame(() => {
      const latestGroupElement = groupElementRef.current
      if (!latestGroupElement || latestGroupElement.offsetWidth === 0 || latestGroupElement.offsetHeight === 0) {
        return
      }

      const appliedLayout = group.setLayout(layout)
      if (!isInvalidMinimizedLayout(appliedLayout)) {
        shouldRestoreStableLayoutRef.current = false
        lastStableLayoutRef.current = appliedLayout
        setRestoredLayout(appliedLayout)
        syncLayoutVisibleState(appliedLayout)
        setGroupRevision((revision) => revision + 1)
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

      if (isLayoutFromHiddenWindow || (isInvalidMinimizedLayout(layout) && !allowCollapsedLayoutSaveRef.current)) {
        shouldRestoreStableLayoutRef.current = true
        return
      }

      const openLayout = normalizeOpenLayout(layout, lastOpenLayoutRef.current)
      lastStableLayoutRef.current = layout
      lastOpenLayoutRef.current = openLayout
      syncLayoutVisibleState(layout)
      onLayoutChanged(openLayout)
    },
    [onLayoutChanged, syncLayoutVisibleState],
  )

  const allowNextCollapsedLayoutSave = () => {
    allowCollapsedLayoutSaveRef.current = true
    window.setTimeout(() => {
      allowCollapsedLayoutSaveRef.current = false
    }, 500)
  }

  const toggleLeftPanelVisible = () => {
    const panel = leftPanelRef.current
    if (panel) {
      allowNextCollapsedLayoutSave()
      if (panel.isCollapsed()) {
        panel.expand()
        setLeftBarVisible(true)
      } else {
        panel.collapse()
        setLeftBarVisible(false)
      }
    }
  }

  const toggleRightPanelVisible = () => {
    const panel = rightPanelRef.current
    if (panel) {
      allowNextCollapsedLayoutSave()
      if (panel.isCollapsed()) {
        panel.expand()
        setRightBarVisible(true)
      } else {
        panel.collapse()
        setRightBarVisible(false)
      }
    }
  }

  const { getBookMarkList } = useBookMarksStore()

  useCommandInit()

  useEffect(() => {
    appInfoStoreSetup()
    useCommandStore.getState().addCommand({
      id: 'app_toggleLeftsidebarVisible',
      handler: toggleLeftPanelVisible,
    })
    useCommandStore.getState().addCommand({
      id: 'app_toggleRightsidebarVisible',
      handler: toggleRightPanelVisible,
    })

    leftPanelRef.current?.isCollapsed() ? setLeftBarVisible(false) : setLeftBarVisible(true)
    rightPanelRef.current?.isCollapsed() ? setRightBarVisible(false) : setRightBarVisible(true)
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
        key={groupRevision}
        defaultLayout={restoredLayout ?? defaultLayout ?? DEFAULT_ROOT_LAYOUT}
        elementRef={groupElementRef}
        groupRef={groupRef}
        onLayoutChanged={persistLayout}
        style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--mf-bg-color)' }}
      >
        <Panel
          id='root-left'
          collapsible
          collapsedSize={0}
          defaultSize={20}
          minSize={160}
          panelRef={leftPanelRef}
        >
          <SideBar />
        </Panel>
        <StyleSeparator />
        <Panel id='root-center' defaultSize={60} minSize={40}>
          <EditorArea />
        </Panel>
        <StyleSeparator />
        <Panel
          id='root-right'
          collapsible
          collapsedSize={0}
          defaultSize={20}
          minSize={160}
          panelRef={rightPanelRef}
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
