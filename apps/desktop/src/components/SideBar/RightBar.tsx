import { RIGHTBARITEMKEYS } from '@/constants'
import TABLEOFCONTENT from '@/extensions/table-of-content'
import { memo } from 'react'
import { Container as SideBarContainer } from './styles'

function RightBar() {
  return (
    <SideBarContainer noActiveItem={false}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {TABLEOFCONTENT.components}
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

export default memo(RightBar)
