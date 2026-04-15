import type { BindingApi } from '@tweakpane/core'
import type { Scene } from 'three'
import { Color, Fog, FogExp2, MeshBasicMaterial, MeshDepthMaterial, MeshNormalMaterial } from 'three'

import type GUIController from '../gui/gui'
import type { GUIType } from '../gui/gui-types'
import { clearBindings } from '../gui/gui-utils'

export function backgroundBinding(gui: GUIType, object: Scene, controller: GUIController) {
  const bindings: BindingApi[] = []
  const api = controller.api
  api.background = ''
  gui
    .addBinding(api, 'background', {
      options: {
        //
        none: '',
        color: new Color(0xaaaaaa),
      },
    })
    .on('change', () => {
      clearBindings(bindings)
      if (api.background instanceof Color) {
        ;(object as Scene).background = api.background
        bindings.push(
          gui.addBinding(api, 'background', {
            color: { type: 'float' },
            label: 'color',
          }),
        )
      } else {
        ;(object as Scene).background = null
      }
    })
  gui.addBinding(object, 'environmentIntensity', {
    min: 0,
    label: 'environmentIntensity',
  })
  gui.addBinding(object, 'backgroundIntensity', {
    min: 0,
    label: 'backgroundIntensity',
  })
  gui.addBinding(object, 'backgroundBlurriness', {
    min: 0,
    max: 1,
    label: 'backgroundBlurriness',
  })
}

export function fogBinding(gui: GUIType, object: Scene, controller: GUIController) {
  const bindings: BindingApi[] = []
  const api = controller.api
  api.fog = ''

  if (object.fog instanceof Fog) {
    api.fog = 'linear'
  } else if (object.fog instanceof FogExp2) {
    api.fog = 'exponential'
  }

  gui
    .addBinding(api, 'fog', {
      options: {
        //
        none: '',
        linear: object.fog || new Fog(0xaaaaaa, 0.1, 50),
        exponential: object.fog || new FogExp2(0xaaaaaa, 0.05),
      },
    })
    .on('change', () => {
      clearBindings(bindings)
      if (api.fog instanceof Fog || controller.api.fog instanceof FogExp2) {
        ;(object as Scene).fog = controller.api.fog
        if (api.fog instanceof Fog) {
          bindings.push(
            gui.addBinding(api.fog, 'color', { color: { type: 'float' } }),
            gui.addBinding(api.fog, 'near', { min: 0, max: 1, step: 0.01 }),
            gui.addBinding(api.fog, 'far', { min: 0, max: 100, step: 0.01 }),
          )
        }
        if (api.fog instanceof FogExp2) {
          bindings.push(
            gui.addBinding(api.fog, 'color', { color: { type: 'float' } }),
            gui.addBinding(api.fog, 'density', { min: 0, max: 1, step: 0.01 }),
          )
        }
      } else {
        ;(object as Scene).fog = null
      }
    })
}

export function materialOverrideBinding(gui: GUIType, object: Scene, controller: GUIController) {
  const api = controller.api
  api.overrideMaterial = ''
  gui
    .addBinding(api, 'overrideMaterial', {
      options: {
        //
        none: '',
        wireframe: new MeshBasicMaterial({ wireframe: true }),
        normal: new MeshNormalMaterial(),
        depth: new MeshDepthMaterial(),
      },
    })
    .on('change', () => {
      if (
        api.overrideMaterial instanceof MeshBasicMaterial ||
        api.overrideMaterial instanceof MeshNormalMaterial ||
        api.overrideMaterial instanceof MeshDepthMaterial
      ) {
        ;(object as Scene).overrideMaterial = api.overrideMaterial
      } else {
        ;(object as Scene).overrideMaterial = null
      }
    })
}
