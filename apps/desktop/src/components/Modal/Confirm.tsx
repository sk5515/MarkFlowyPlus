import NiceModal, { useModal } from '@ebay/nice-modal-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

export interface ConfirmModalProps {
  title?: string
  content?: ReactNode
  confirmText?: string
  cancelText?: string
  actionsGenerater?: (hideModal: () => void) => ReactNode[]
  onConfirm?: () => void
  onClose?: () => void
}

export const MODAL_CONFIRM_ID = 'modal-confirm'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  min-width: 100vw;
  min-height: 100vh;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.dialogBackdropColor};
  box-sizing: border-box;
`

const Panel = styled.div`
  width: min(420px, 100%);
  max-height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.dialogBgColor};
  color: ${({ theme }) => theme.primaryFontColor};
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
`

const Title = styled.div`
  font-size: 15px;
  line-height: 1.55;
  font-weight: 600;
  overflow-wrap: anywhere;
`

const Content = styled.div`
  font-size: 13px;
  line-height: 1.6;
  overflow: auto;
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.unselectedFontColor};
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  column-gap: 5px;
  row-gap: 5px;
  gap: 5px;
  flex-wrap: wrap;

  > * {
    margin: 0 !important;
  }

  > * + * {
    margin-left: 5px !important;
  }

  button {
    min-width: 96px;
    padding-left: 16px;
    padding-right: 16px;
  }
`

const ActionButton = styled.button<{ $primary?: boolean }>`
  min-width: 72px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.accentColor : theme.borderColor)};
  background: ${({ theme, $primary }) => ($primary ? theme.accentColor : 'transparent')};
  color: ${({ theme, $primary }) => ($primary ? '#fff' : theme.primaryFontColor)};
  font: inherit;
  cursor: pointer;

  &:hover {
    background: ${({ theme, $primary }) => ($primary ? theme.accentColor : theme.hoverColor)};
  }
`

export const ConfirmModal = ({
  title,
  content,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  actionsGenerater,
}: ConfirmModalProps) => {
  const modal = useModal()
  const { t } = useTranslation()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    modal.hide()
  }

  const handleClose = () => {
    onClose?.()
    modal.hide()
  }

  if (!modal.visible) return null

  return (
    <Overlay
      role='presentation'
      onMouseDown={handleClose}
    >
      <Panel
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? 'confirm-modal-title' : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title && <Title id='confirm-modal-title'>{title}</Title>}
        {content && <Content>{content}</Content>}
        <Actions>
          {actionsGenerater ? (
            actionsGenerater(modal.hide)
          ) : (
            <>
              <ActionButton type='button' onClick={handleClose}>
                {cancelText ?? t('common.cancel')}
              </ActionButton>
              <ActionButton type='button' $primary onClick={handleConfirm}>
                {confirmText ?? t('common.confirm')}
              </ActionButton>
            </>
          )}
        </Actions>
      </Panel>
    </Overlay>
  )
}

export const Confirm = NiceModal.create(ConfirmModal)
