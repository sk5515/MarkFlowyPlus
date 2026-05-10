import { type FC } from 'react'
import type { EditorContext } from 'rme'
import styled from 'styled-components'
import { FindController } from './find-controller'
import { FindInput } from './find-input'
import { ReplaceController } from './replace-controller'
import { ReplaceInput } from './replace-input'
import { useFindReplace } from './use-find-replace'

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  > * + * {
    margin-top: 5px;
  }
`

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 1fr) auto;
  gap: 5px 8px;
  align-items: center;
  min-width: 0;
`

export interface FindReplaceComponentProps {
  onDismiss?: () => void
  editorCtx: EditorContext
}

export const FindReplaceComponent: FC<FindReplaceComponentProps> = ({ onDismiss, editorCtx }) => {
  const {
    query,
    setQuery,
    activeIndex,
    total,
    caseSensitive,
    replacement,
    setReplacement,
    toggleCaseSensitive,
    find,
    findNext,
    findPrev,
    stopFind,
    replace,
    replaceAll,
  } = useFindReplace(editorCtx)

  return (
    <Panel>
      <Row>
        <FindInput
          query={query}
          setQuery={setQuery}
          onFind={find}
          total={total}
          activeIndex={activeIndex}
        />
        <FindController
          findPrev={findPrev}
          findNext={findNext}
          toggleCaseSensitive={toggleCaseSensitive}
          caseSensitive={caseSensitive}
          stopFind={stopFind}
          onDismiss={onDismiss}
        />
      </Row>
      <Row>
        <ReplaceInput replacement={replacement} setReplacement={setReplacement} />
        <ReplaceController replace={replace} replaceAll={replaceAll} />
      </Row>
    </Panel>
  )
}
