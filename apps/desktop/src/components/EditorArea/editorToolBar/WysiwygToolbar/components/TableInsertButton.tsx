import type { EditorContext } from 'rme'
import { FC, MouseEvent, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const MAX_ROWS = 8
const MAX_COLS = 8
const CELL_SIZE = 18
const CELL_GAP = 4

const Button = styled.i`
  position: relative;
`

const Picker = styled.div`
  position: fixed;
  z-index: 10000;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.tipsBgColor};
  box-shadow: 0 8px 24px ${({ theme }) => theme.boxShadowColor};
  border-radius: 6px;
`

const PickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${MAX_COLS}, ${CELL_SIZE}px);
  gap: ${CELL_GAP}px;
`

const PickerCell = styled.button<{ $active: boolean }>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  padding: 0;
  border-radius: 3px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.accentColor : theme.borderColor)};
  background: ${({ theme, $active }) => ($active ? theme.hoverColor : theme.bgColor)};
  cursor: pointer;
`

const PickerLabel = styled.div`
  height: 18px;
  margin-top: 7px;
  color: ${({ theme }) => theme.primaryFontColor};
  font-size: 12px;
  line-height: 18px;
  text-align: center;
`

interface TableInsertButtonProps {
  editorCtx: EditorContext
  label: string
}

const insertTable = (editorCtx: EditorContext, rows: number, cols: number) => {
  const view = editorCtx.view
  const { schema } = view.state
  const tableNode = schema.nodes.table
  const rowNode = schema.nodes.tableRow
  const cellNode = schema.nodes.tableCell

  if (!tableNode || !rowNode || !cellNode) {
    return
  }

  const tableRows = Array.from({ length: rows }, () => {
    const cells = Array.from({ length: cols }, () => cellNode.createAndFill() ?? cellNode.create())
    return rowNode.create(null, cells)
  })

  const table = tableNode.create(null, tableRows)
  view.focus()
  view.dispatch(view.state.tr.replaceSelectionWith(table).scrollIntoView())
}

export const TableInsertButton: FC<TableInsertButtonProps> = ({ editorCtx, label }) => {
  const buttonRef = useRef<HTMLElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState({ rows: 1, cols: 1 })
  const [position, setPosition] = useState({ left: 0, top: 0 })

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const showPicker = useCallback(() => {
    cancelClose()
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setPosition({ left: rect.left, top: rect.bottom + 6 })
    }
    setOpen(true)
  }, [cancelClose])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, 120)
  }, [cancelClose])

  const handleMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (open) {
        setOpen(false)
        return
      }
      showPicker()
    },
    [open, showPicker],
  )

  const handleCellMouseDown = useCallback(
    (event: MouseEvent<HTMLButtonElement>, rows: number, cols: number) => {
      event.preventDefault()
      event.stopPropagation()
      insertTable(editorCtx, rows, cols)
      setOpen(false)
    },
    [editorCtx],
  )

  return (
    <span onMouseEnter={showPicker} onMouseLeave={scheduleClose}>
      <Button
        ref={buttonRef}
        className='icon ri-table-line icon-small icon-smooth'
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        aria-label={label}
        title={label}
      />
      {open
        ? createPortal(
            <Picker
              style={{ left: position.left, top: position.top }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
            >
              <PickerGrid>
                {Array.from({ length: MAX_ROWS }, (_, rowIndex) =>
                  Array.from({ length: MAX_COLS }, (_, colIndex) => {
                    const rows = rowIndex + 1
                    const cols = colIndex + 1
                    const active = rows <= hovered.rows && cols <= hovered.cols

                    return (
                      <PickerCell
                        key={`${rows}-${cols}`}
                        type='button'
                        $active={active}
                        onMouseEnter={() => setHovered({ rows, cols })}
                        onMouseDown={(event) => handleCellMouseDown(event, rows, cols)}
                        aria-label={`${rows} x ${cols}`}
                      />
                    )
                  }),
                )}
              </PickerGrid>
              <PickerLabel>
                {hovered.rows} x {hovered.cols}
              </PickerLabel>
            </Picker>,
            document.body,
          )
        : null}
    </span>
  )
}
