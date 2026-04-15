import type { FolderApi, TabPageApi } from '@tweakpane/core'
import type { Vector3 } from 'three'

import GUIController from '../gui'
import guiEvents, { GUIEditorEvent } from '../gui-events'

export default class folderscaleController extends GUIController {
  defaultValue: Vector3
  uniformScale = false
  private lastUniformValue = 1

  constructor(gui: FolderApi | TabPageApi) {
    super(gui)
    this.gui = gui

    this.defaultValue = GUIController.state.activeObject.scale.clone()

    // Add uniform scale toggle
    gui
      .addBinding(this, 'uniformScale', {
        label: 'scale XYZ',
      })
      .on('change', ev => {
        if (ev.value) {
          // When enabling uniform scale, set all values to the average
          const currentScale = GUIController.state.activeObject.scale
          const avgScale = (currentScale.x + currentScale.y + currentScale.z) / 3
          this.lastUniformValue = avgScale
          currentScale.setScalar(avgScale)
          this.gui.refresh()
          guiEvents.dispatchEvent({
            type: GUIEditorEvent.ObjectTransformChanged,
          })
        }
      })

    gui.addBinding(GUIController.state.activeObject, 'scale').on('change', ev => {
      if (this.uniformScale) {
        // When uniform scaling is enabled, detect which component changed
        // and apply that value to all components
        const scale = ev.value
        const prevScale = this.lastUniformValue

        // Find which component changed the most from the last uniform value
        const xDiff = Math.abs(scale.x - prevScale)
        const yDiff = Math.abs(scale.y - prevScale)
        const zDiff = Math.abs(scale.z - prevScale)

        let newValue = scale.x
        if (yDiff > xDiff && yDiff > zDiff) {
          newValue = scale.y
        } else if (zDiff > xDiff && zDiff > yDiff) {
          newValue = scale.z
        }

        this.lastUniformValue = newValue
        scale.setScalar(newValue)
        this.gui.refresh()
      }

      guiEvents.dispatchEvent({
        type: GUIEditorEvent.ObjectTransformChanged,
      })
    })

    guiEvents.addEventListener(GUIEditorEvent.ObjectTransformChanged, () => {
      this.gui.refresh()
    })
  }

  save() {
    return GUIController.state.activeObject.scale.toArray()
  }

  reset() {
    GUIController.state.activeObject.scale.copy(this.defaultValue)
    this.uniformScale = false
    this.lastUniformValue = 1
    this.gui.refresh()
  }
}
