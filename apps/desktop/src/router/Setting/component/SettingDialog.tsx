import { EVENT } from '@/constants'
import { Setting } from '@/router'
import { currentWindow } from '@/services/windows'
import { useCommandStore } from '@/stores'
import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Dialog } from 'zens'

const SettingDialogWrapper = styled(Dialog)`
  z-index: 4000;
  width: 86vw;
  max-width: 1280px;
  min-width: 700px;
  height: 90vh;
  overflow: hidden;
  background-color: ${(props) => props.theme.bgColor};
  transition: all 0.3s ease-in-out;

  .dialog-content {
    height: calc(100% - 60px);
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
        setOpen(true)
      },
    })

    const unlistenOpenSetting = currentWindow.listen(EVENT.app_openSetting, () => setOpen(true))
    const unlistenNativeMenu = currentWindow.listen<string>('native:menu', ({ payload }) => {
      if (payload === EVENT.app_openSetting) {
        setOpen(true)
      }
    })

    return () => {
      unlistenOpenSetting.then((fn) => fn())
      unlistenNativeMenu.then((fn) => fn())
    }
  }, [])

  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <SettingDialogWrapper
      width='70vw'
      title={t('settings.label')}
      open={open}
      onClose={handleClose}
    >
      <Setting />
    </SettingDialogWrapper>
  )
})
