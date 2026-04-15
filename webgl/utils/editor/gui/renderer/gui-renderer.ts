import { REVISION } from 'three'

import {
  rendererShadowMapBinding,
  rendererShadowMapTypeBinding,
  rendererToneMappingBinding,
  rendererToneMappingExposureBinding,
} from '../../bindings/gui-renderer-bindings'
import GUIController from '../gui'
import type { GUIType } from '../gui-types'

export default class GUIRendererController extends GUIController {
  constructor(gui: GUIType) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Renderer' })
    this.api.version = REVISION

    this.gui.addBinding(this.api, 'version', { readonly: true })
    rendererShadowMapBinding(this.gui, GUIController.state.renderer)
    rendererShadowMapTypeBinding(this.gui, GUIController.state.renderer)
    rendererToneMappingBinding(this.gui, GUIController.state.renderer)
    rendererToneMappingExposureBinding(this.gui, GUIController.state.renderer)

    console.log('webgl', `Threejs revision: ${REVISION}`)
  }
}
