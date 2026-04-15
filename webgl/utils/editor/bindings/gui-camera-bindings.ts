import type { PerspectiveCamera } from 'three'

import type { GUIType } from '../gui/gui-types'

export function fovBinding(gui: GUIType, object: PerspectiveCamera) {
  gui.addBinding(object, 'fov', { min: 1, max: 120 }).on('change', () => {
    object.updateProjectionMatrix()
  })
}

export function nearBinding(gui: GUIType, object: PerspectiveCamera) {
  gui.addBinding(object, 'near', { min: 0 }).on('change', () => {
    object.updateProjectionMatrix()
  })
}

export function farBinding(gui: GUIType, object: PerspectiveCamera) {
  gui.addBinding(object, 'far', { min: 0 }).on('change', () => {
    object.updateProjectionMatrix()
  })
}
