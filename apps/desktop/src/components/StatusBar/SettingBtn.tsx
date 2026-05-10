
import { EVENT } from '@/constants'
import bus from '@/helper/eventBus'
import { logger } from '@/helper/logger'
import appSettingService from '@/services/app-setting'
import { useCommandStore, useEditorStore } from '@/stores'
import useContextMenuStore from '@/stores/useContextMenuStore'
import useThemeStore from '@/stores/useThemeStore'
import { memo, type MouseEvent, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { hideContextMenu, showContextMenu } from '../ui-v2/ContextMenu/ContextMenu'

export const CenterMenu = memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const { themes, curTheme, setCurThemeByName } = useThemeStore()
  const { activeId } = useEditorStore()
  const { t } = useTranslation()

  const getThemeMenu = useCallback(() => {
    return themes.map((theme) => {
      return {
        label: theme.name,
        value: theme.name,
        checked: curTheme.name === theme.name,
        handler: () => {
          appSettingService.writeSettingData({ key: 'theme' }, theme.name)
          setCurThemeByName(theme.name)
        },
      }
    })
  }, [themes, curTheme, setCurThemeByName])

  const getExportMenu = useCallback(() => {
    if (!activeId) {
      return []
    }

    return [
      {
        type: 'divider' as const,
      },
      {
        value: 'export_html',
        label: t('contextmenu.editor_tab.export_html'),
        handler: () => {
          bus.emit('editor_export_html')
        },
      },
      {
        value: 'export_image',
        label: t('contextmenu.editor_tab.export_image'),
        handler: () => {
          bus.emit('editor_export_image')
        },
      },
      {
        value: 'export_pdf',
        label: t('contextmenu.editor_tab.export_pdf'),
        handler: () => {
          bus.emit('editor_export_pdf')
        },
      },
    ]
  }, [activeId, t])

  const handleToggleMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (useContextMenuStore.getState().open) {
      hideContextMenu()
      return
    }

    if (!ref.current) {
      return
    }
    const rect = ref.current.getClientRects()

    const themeMenu = getThemeMenu()
    const exportMenu = getExportMenu()

    showContextMenu({
      items: [
        {
          label: t('view.theme.label'),
          value: 'theme',
          children: themeMenu,
        },
        {
          label: t('settings.label'),
          value: 'settings',
          handler: () => {
            logger.info('Setting menu item clicked')
            useCommandStore.getState().execute(EVENT.app_openSetting)
            // FIXME tauri 2.0 bug in windows https://github.com/tauri-apps/plugins-workspace/issues/656
            // invoke('open_conf_window')
          },
        },
        ...exportMenu,
      ],
      x: rect[0]?.left || 12,
      y: rect[0]?.bottom + 4 || 0,
    })
  }

  return (
    <Container
      className='icon-small icon-smooth'
      ref={ref}
      onMouseDown={handleToggleMenu}
      onContextMenu={handleToggleMenu}
    >
      <i className='ri-settings-3-line'></i>
    </Container>
  )
})

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;

  &:hover {
    background-color: ${(props) => props.theme.hoverColor};
  }
`
