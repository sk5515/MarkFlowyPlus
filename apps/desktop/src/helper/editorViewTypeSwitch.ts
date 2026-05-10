import { EditorViewType } from 'rme'
import bus from './eventBus'

const SWITCH_DEBOUNCE_MS = 500
let lastSwitchAt = 0

export const emitEditorViewTypeSwitch = (viewType: EditorViewType) => {
  const now = Date.now()

  if (now - lastSwitchAt < SWITCH_DEBOUNCE_MS) {
    return
  }

  lastSwitchAt = now
  bus.emit('editor_toggle_type', viewType)
}
