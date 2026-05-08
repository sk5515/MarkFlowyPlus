import { Explorer } from '@/components'
import { RIGHTBARITEMKEYS } from '@/constants'
import { Search } from '@/extensions/search'
import { readDirectory } from '@/helper/filesys'
import { useEditorStore } from '@/stores'
import classNames from 'classnames'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, toast } from 'zens'
import { fileTreeHandler } from '../FileTree/FileTree'
import { MfIconButton } from '../ui-v2/Button'
import { Container as SideBarContainer, SideBarHeader } from './styles'

function SideBar() {
  const { t } = useTranslation()
  const { folderData } = useEditorStore()
  const [activeRightBarItemKey, setActiveRightBarItemKey] = useState<RIGHTBARITEMKEYS>(
    RIGHTBARITEMKEYS.Explorer,
  )

  const leftBarDataSource: RightBarItem[] = useMemo(() => {
    return [
      {
        title: RIGHTBARITEMKEYS.Explorer,
        key: RIGHTBARITEMKEYS.Explorer,
        icon: <i className='ri-file-list-3-line' />,
        components: <Explorer />,
      },
      Search,
    ]
  }, [])

  const activeRightBarItem = useMemo(() => {
    const activeItem = leftBarDataSource.find((item) => item.key === activeRightBarItemKey)
    return activeItem
  }, [activeRightBarItemKey, leftBarDataSource])

  const noActiveItem = !activeRightBarItemKey
  const showExplorerActions =
    activeRightBarItemKey === RIGHTBARITEMKEYS.Explorer && Boolean(folderData?.[0])

  const handleRefreshExplorer = useCallback(async (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation()
    e?.preventDefault()

    const rootPath = useEditorStore.getState().getRootPath()
    if (!rootPath) {
      toast.error('No workspace found')
      return
    }

    const data = await readDirectory(rootPath)
    fileTreeHandler.updateTreeView?.({ data })
  }, [])

  const handleFocusActiveFile = useCallback((e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation()
    e?.preventDefault()

    const activeId = useEditorStore.getState().activeId
    if (activeId) {
      fileTreeHandler.rootTree?.scrollTo(activeId)
    }
  }, [])

  const handleCollapseExplorer = useCallback((e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation()
    e?.preventDefault()

    const rootId = useEditorStore.getState().folderData?.[0]?.id
    fileTreeHandler.rootTree?.closeAll()
    if (rootId) {
      fileTreeHandler.rootTree?.open(rootId)
    }
  }, [])

  return (
    <SideBarContainer noActiveItem={noActiveItem}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <SideBarHeader>
          <div className='app-sidebar-tabs'>
            {leftBarDataSource.map((item) => {
              const cls = classNames('icon', 'icon-small', 'icon-smooth', {
                'app-sidebar-active': activeRightBarItemKey === item.key,
                'icon-unselected': activeRightBarItemKey !== item.key
              })

              const handleRightBarItemClick = () => {
                setActiveRightBarItemKey(item.key)
              }

              return (
                <Tooltip key={item.key} title={item.title}>
                  <div className={cls} onClick={handleRightBarItemClick}>
                    {item.icon}
                  </div>
                </Tooltip>
              )
            })}
          </div>
          {showExplorerActions ? (
            <div className='app-sidebar-actions'>
              <MfIconButton
                size='small'
                rounded='smooth'
                icon={'ri-refresh-line'}
                onClick={handleRefreshExplorer}
                tooltipProps={{ title: t('explorer.refresh_folder_data') }}
              />
              <MfIconButton
                size='small'
                rounded='smooth'
                icon={'ri-focus-3-line'}
                onClick={handleFocusActiveFile}
                tooltipProps={{ title: t('explorer.focus_active_file') }}
              />
              <MfIconButton
                size='small'
                rounded='smooth'
                icon={'ri-collapse-vertical-fill'}
                onClick={handleCollapseExplorer}
                tooltipProps={{ title: t('explorer.collapse_folders') }}
              />
            </div>
          ) : null}
        </SideBarHeader>
        {activeRightBarItem?.components ?? null}
      </div>
    </SideBarContainer>
  )
}

export interface RightBarItem {
  title: RIGHTBARITEMKEYS
  key: RIGHTBARITEMKEYS
  icon: React.ReactNode
  components: any
}

export default memo(SideBar)
