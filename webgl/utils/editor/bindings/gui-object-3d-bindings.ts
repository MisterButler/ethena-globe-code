import type { Object3D } from 'three'

import type { GUIType } from '../gui/gui-types'

export function typeBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'type')
}

export function uuidBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'uuid')
}

export function nameBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'name')
}

export function castShadowBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'castShadow')
}

export function receiveShadowBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'receiveShadow')
}

export function visibleBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'visible')
}

export function frustumCulledBinding(gui: GUIType, object: Object3D) {
  gui.addBinding(object, 'frustumCulled')
}
