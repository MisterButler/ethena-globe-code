import type { AmbientLight, DirectionalLight, HemisphereLight, PointLight, SpotLight } from 'three'

import type { GUIType } from '../gui/gui-types'

type Light = AmbientLight | DirectionalLight | HemisphereLight | PointLight | SpotLight

export function lightColorBinding(gui: GUIType, object: Light) {
  gui.addBinding(object, 'color', { color: { type: 'float' } })
}

export function lightGroundColorBinding(gui: GUIType, object: HemisphereLight) {
  gui.addBinding(object, 'groundColor', { color: { type: 'float' } })
}

export function lightIntensityBinding(gui: GUIType, object: Light) {
  gui.addBinding(object, 'intensity', { step: 0.01 })
}

export function lightDirectionBinding(gui: GUIType, object: Light) {
  gui.addBinding(object, 'position')
}

export function lightDecayBinding(gui: GUIType, object: PointLight | SpotLight) {
  gui.addBinding(object, 'decay', { min: 0, max: 10, step: 0.01 })
}

export function lightDistanceBinding(gui: GUIType, object: PointLight | SpotLight) {
  gui.addBinding(object, 'distance', { min: 0, max: 100, step: 0.01 })
}

export function lightPowerBinding(gui: GUIType, object: PointLight | SpotLight) {
  gui.addBinding(object, 'power', { min: 0, max: 10, step: 0.01 })
}

export function lightAngleBinding(gui: GUIType, object: SpotLight) {
  gui.addBinding(object, 'angle', { min: 0, max: Math.PI / 2, step: 0.01 })
}

export function lightPenumbraBinding(gui: GUIType, object: SpotLight) {
  gui.addBinding(object, 'penumbra', { min: 0, max: 1, step: 0.01 })
}
