import type { WebGLRenderer } from 'three'
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  CustomToneMapping,
  LinearToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  ReinhardToneMapping,
} from 'three'

import type { GUIType } from '../gui/gui-types'

export function rendererShadowMapBinding(gui: GUIType, renderer: WebGLRenderer) {
  gui.addBinding(renderer.shadowMap, 'enabled', { label: 'Shadow Map' })
}

export function rendererShadowMapTypeBinding(gui: GUIType, renderer: WebGLRenderer) {
  gui.addBinding(renderer.shadowMap, 'type', {
    label: 'Shadow Map Type',
    options: {
      //
      Basic: BasicShadowMap,
      Pcf: PCFShadowMap,
      'Pcf Soft': PCFSoftShadowMap,
    },
  })
}

export function rendererToneMappingBinding(gui: GUIType, renderer: WebGLRenderer) {
  gui.addBinding(renderer, 'toneMapping', {
    label: 'Tone Mapping',
    options: {
      None: NoToneMapping,
      Linear: LinearToneMapping,
      Neutral: NeutralToneMapping,
      Reinhard: ReinhardToneMapping,
      Cineon: CineonToneMapping,
      ACESFilmic: ACESFilmicToneMapping,
      AgX: AgXToneMapping,
      Custom: CustomToneMapping,
    },
  })
}

export function rendererToneMappingExposureBinding(gui: GUIType, renderer: WebGLRenderer) {
  gui.addBinding(renderer, 'toneMappingExposure', {
    step: 0.01,
    label: 'Tone Mapping Exposure',
  })
}
