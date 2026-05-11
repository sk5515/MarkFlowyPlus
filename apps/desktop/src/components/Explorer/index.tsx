import { Empty, FileTree } from '@/components'
import type { IFile } from '@/helper/filesys'
import { useEditorStore } from '@/stores'
import classNames from 'classnames'
import type { FC, MouseEventHandler } from 'react'
import { memo, useCallback, useState } from 'react'
import { Container } from './styles'

const Explorer: FC<ExplorerProps> = (props) => {
  const { folderData, activeId, addOpenedFile, setActiveId } = useEditorStore()
  const [dndRootElement, setDndRootElement] = useState<HTMLDivElement | null>(null)

  const handleSelect = (item: IFile) => {
    if (item?.kind !== 'file') return

    addOpenedFile(item.id)
    setActiveId(item.id)
  }

  const handleContextMenu: MouseEventHandler = useCallback((e) => e.preventDefault(), [])

  const containerCLs = classNames(props.className)

  return (
    <Container className={containerCLs} onContextMenu={handleContextMenu}>
      <div
        className='explorer-tree-root h-full w-full overflow-hidden'
        ref={(ref) => setDndRootElement(ref)}
      >
        {folderData && folderData.length > 0 ? (
          <FileTree
            data={folderData}
            activeId={activeId}
            onSelect={handleSelect}
            dndRootElement={dndRootElement as unknown as Node}
          />
        ) : (
          <Empty />
        )}
      </div>
    </Container>
  )
}

interface ExplorerProps {
  className?: string
}

export default memo(Explorer)
