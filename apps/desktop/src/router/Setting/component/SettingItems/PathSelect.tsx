import appSettingService from '@/services/app-setting'
import useAppSettingStore from '@/stores/useAppSettingStore'
import { open } from '@tauri-apps/plugin-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from 'zens'
import type { SettingItemProps } from '.'
import { SettingItemContainer } from './Container'
import { SettingLabel } from './Label'

const PathSelectSettingItem: React.FC<SettingItemProps<Setting.PathSelectSettingItem>> = (props) => {
  const { item } = props
  const { t } = useTranslation()
  const { settingData } = useAppSettingStore()
  const curValue = settingData[item.key]

  return (
    <SettingItemContainer>
      <SettingLabel item={item} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flex: '0 0 50%',
          gap: 8,
        }}
      >
        <Button
          onClick={async () => {
            const dir = await open({ directory: true, recursive: true })
            if (typeof dir !== 'string') return
            appSettingService.writeSettingData(item, dir)
          }}
        >
          {t('file.openDir')}
        </Button>
        {curValue ? (
          <Button size='small' onClick={() => appSettingService.writeSettingData(item, null)}>
            {t('common.clear')}
          </Button>
        ) : null}
        <span
          style={{ color: '#888', fontSize: '12px', wordBreak: 'break-all', textAlign: 'right' }}
        >
          {curValue || t('common.none')}
        </span>
      </div>
    </SettingItemContainer>
  )
}

export default PathSelectSettingItem
