import type { CSSProperties } from 'react'
import { Toaster } from 'sonner'
import { createGlobalStyle, useTheme } from 'styled-components'

const NotificationStyles = createGlobalStyle`
  [data-sonner-toaster].mf-notifications {
    --width: 380px;
    font-family: ${(props) => props.theme.fontFamily};
    z-index: 7000;
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-styled='true'] {
    position: relative;
    align-items: flex-start;
    gap: 12px;
    min-height: 56px;
    padding: 13px 14px 13px 16px;
    border: 1px solid ${(props) => props.theme.borderColor};
    border-radius: 8px;
    background: ${(props) => props.theme.dialogBgColor};
    color: ${(props) => props.theme.primaryFontColor};
    box-shadow: 0 14px 38px ${(props) => props.theme.boxShadowColor};
    overflow: hidden;
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-styled='true']::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${(props) => props.theme.accentColor};
    content: '';
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-type='success']::before {
    background: ${(props) => props.theme.successColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-type='error']::before {
    background: ${(props) => props.theme.dangerColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-type='warning']::before {
    background: ${(props) => props.theme.warnColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-icon] {
    width: 24px;
    height: 24px;
    margin: 1px 0 0;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: ${(props) => props.theme.accentColorFocused};
    color: ${(props) => props.theme.accentColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-type='success'] [data-icon] {
    color: ${(props) => props.theme.successColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-type='error'] [data-icon] {
    color: ${(props) => props.theme.dangerColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast][data-type='warning'] [data-icon] {
    color: ${(props) => props.theme.warnColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-icon] svg {
    width: 17px;
    height: 17px;
    margin: 0;
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-content] {
    min-width: 0;
    flex: 1 1 auto;
    gap: 4px;
    padding-right: 18px;
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-title] {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    color: ${(props) => props.theme.primaryFontColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-description] {
    font-size: 12px;
    line-height: 1.5;
    color: ${(props) => props.theme.unselectedFontColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-button] {
    height: 28px;
    min-width: 76px;
    margin-top: -1px;
    padding: 0 12px;
    border: 1px solid ${(props) => props.theme.accentColor};
    border-radius: 6px;
    background: ${(props) => props.theme.accentColor};
    color: ${(props) => props.theme.white};
    font-size: 12px;
    font-weight: 600;
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-cancel] {
    border-color: ${(props) => props.theme.borderColor};
    background: ${(props) => props.theme.buttonBgColor};
    color: ${(props) => props.theme.primaryFontColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-button]:hover {
    filter: brightness(1.04);
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-close-button] {
    top: 10px;
    right: 10px;
    left: auto;
    width: 22px;
    height: 22px;
    transform: none;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${(props) => props.theme.labelFontColor};
  }

  [data-sonner-toaster].mf-notifications [data-sonner-toast] [data-close-button]:hover {
    background: ${(props) => props.theme.hoverColor};
    color: ${(props) => props.theme.primaryFontColor};
  }

  [data-sonner-toaster].mf-notifications .sonner-loading-bar {
    background: ${(props) => props.theme.accentColor};
  }

  @media (max-width: 600px) {
    [data-sonner-toaster].mf-notifications {
      --mobile-offset: 12px;
    }

    [data-sonner-toaster].mf-notifications [data-sonner-toast][data-styled='true'] {
      min-height: 54px;
      padding: 12px 12px 12px 15px;
    }
  }
`

export const AppNotifications = () => {
  const theme = useTheme()
  const toastStyle = {
    '--normal-bg': theme.dialogBgColor,
    '--normal-border': theme.borderColor,
    '--normal-text': theme.primaryFontColor,
    '--success-text': theme.successColor,
    '--error-text': theme.dangerColor,
    '--warning-text': theme.warnColor,
    '--info-text': theme.accentColor,
  } as CSSProperties

  return (
    <>
      <NotificationStyles />
      <Toaster
        className='mf-notifications'
        position='top-right'
        expand
        closeButton
        visibleToasts={4}
        gap={10}
        offset={18}
        toastOptions={{
          duration: 5000,
          style: toastStyle,
        }}
      />
    </>
  )
}
