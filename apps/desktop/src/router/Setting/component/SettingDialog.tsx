import { EVENT } from '@/constants'
import { logger } from '@/helper/logger'
import { Setting } from '@/router'
import { currentWindow } from '@/services/windows'
import { useCommandStore } from '@/stores'
import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const SettingDialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.38);
`

const SettingDialogWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 86vw;
  max-width: 1280px;
  min-width: 700px;
  height: 90vh;
  overflow: hidden;
  background-color: ${(props) => props.theme.bgColor};
  color: ${(props) => props.theme.primaryFontColor};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    min-height: 60px;
    padding: 0 20px 0 24px;
    border-bottom: 1px solid ${(props) => props.theme.borderColor};
    font-size: 16px;
    font-weight: 600;
  }

  .dialog-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
    background: transparent;
    color: ${(props) => props.theme.primaryFontColor};
    font-size: 18px;
    line-height: 1;

    &:hover {
      background-color: ${(props) => props.theme.hoverColor};
    }
  }

  .dialog-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 24px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: ${(props) => props.theme.borderColor};
      border-radius: 3px;
    }
  }
`

export const SettingDialog = memo(() => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    useCommandStore.getState().addCommand({
      id: EVENT.app_openSetting,
      handler: () => {
        logger.info('Opening settings from command store')
        setOpen(true)
      },
    })

    logger.info('Setting dialog command registered')

    const unlistenOpenSetting = currentWindow.listen(EVENT.app_openSetting, () => {
      logger.info('Opening settings from window event')
      setOpen(true)
    })
    const unlistenNativeMenu = currentWindow.listen<string>('native:menu', ({ payload }) => {
      if (payload === EVENT.app_openSetting) {
        logger.info('Opening settings from native menu event')
        setOpen(true)
      }
    })

    return () => {
      unlistenOpenSetting.then((fn) => fn())
      unlistenNativeMenu.then((fn) => fn())
    }
  }, [])

  useEffect(() => {
    if (!open) return

    logger.info('Setting dialog rendered open')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleClose = useCallback(() => setOpen(false), [])

  if (!open) {
    return null
  }

  return (
    <SettingDialogOverlay onMouseDown={handleClose}>
      <SettingDialogWrapper onMouseDown={(event) => event.stopPropagation()}>
        <div className='dialog-header'>
          <span>{t('settings.label')}</span>
          <button className='dialog-close' type='button' onClick={handleClose} aria-label='Close'>
            x
          </button>
        </div>
        <div className='dialog-content'>
          <Setting />
        </div>
      </SettingDialogWrapper>
    </SettingDialogOverlay>
  )
})
