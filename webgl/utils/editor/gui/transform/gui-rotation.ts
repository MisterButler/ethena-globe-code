import type { Euler } from 'three'
import { MathUtils } from 'three'
import type { FolderApi, TabPageApi } from 'tweakpane'

import GUIController from '../gui'
import guiEvents, { GUIEditorEvent } from '../gui-events'

export default class GUIRotationController extends GUIController {
  defaultValue: Euler

  constructor(gui: FolderApi | TabPageApi) {
    super(gui)
    this.gui = gui

    this.defaultValue = GUIController.state.activeObject.rotation.clone()

    this.api.rotation = {
      x: 0,
      y: 0,
      z: 0,
    }

    const updateRotation = () => {
      this.api.rotation.x = MathUtils.radToDeg(GUIController.state.activeObject.rotation.x)
      this.api.rotation.y = MathUtils.radToDeg(GUIController.state.activeObject.rotation.y)
      this.api.rotation.z = MathUtils.radToDeg(GUIController.state.activeObject.rotation.z)
    }

    updateRotation()

    const onChange = () => {
      GUIController.state.activeObject.rotation.set(
        MathUtils.degToRad(this.api.rotation.x),
        MathUtils.degToRad(this.api.rotation.y),
        MathUtils.degToRad(this.api.rotation.z),
      )
      guiEvents.dispatchEvent({
        type: GUIEditorEvent.ObjectTransformChanged,
      })
    }

    gui.addBinding(this.api, 'rotation').on('change', onChange)

    guiEvents.addEventListener(GUIEditorEvent.ObjectTransformChanged, () => {
      updateRotation()
      this.gui.refresh()
    })
  }

  save() {
    return GUIController.state.activeObject.rotation.toArray()
  }

  reset() {
    GUIController.state.activeObject.rotation.copy(this.defaultValue)
    this.gui.refresh()
  }
}
