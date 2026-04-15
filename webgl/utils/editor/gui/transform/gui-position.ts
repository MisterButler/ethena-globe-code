import type { Vector3 } from 'three'
import type { FolderApi, TabPageApi } from 'tweakpane'

import GUIController from '../gui'
import guiEvents, { GUIEditorEvent } from '../gui-events'

export default class GUIPositionController extends GUIController {
  defaultValue: Vector3

  constructor(gui: FolderApi | TabPageApi) {
    super(gui)
    this.gui = gui

    this.defaultValue = GUIController.state.activeObject.position.clone()

    gui.addBinding(GUIController.state.activeObject, 'position').on('change', () => {
      guiEvents.dispatchEvent({
        type: GUIEditorEvent.ObjectTransformChanged,
      })
    })

    guiEvents.addEventListener(GUIEditorEvent.ObjectTransformChanged, () => {
      this.gui.refresh()
    })
  }

  save() {
    return GUIController.state.activeObject.position.toArray()
  }

  reset() {
    GUIController.state.activeObject.position.copy(this.defaultValue)
    this.gui.refresh()
  }
}
