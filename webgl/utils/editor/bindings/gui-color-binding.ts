import { GUIType } from '../gui/gui-types'

export function colorBinding(gui: GUIType, color: string) {
  const api = {
    color: `#${color}`,
  }

  return gui.addBinding(api, 'color')
}
