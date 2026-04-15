import { VECTOR_ZERO } from '@/webgl/utils/common/math'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { WebGLRenderer } from 'three'

import BaseScene, { GUIBaseScene } from '../base-scene/base-scene'

export default class EmptyScene extends BaseScene {
  constructor(renderer: WebGLRenderer, id: string, clearColor = 0x000000) {
    super(
      {
        id,
        clearColor,
        controls: { dev: false, main: false },
        preloadGPU: false,
      },
      renderer,
    )
    this.camera.position.set(0, 0, 10)
    this.camera.lookAt(VECTOR_ZERO)
  }
}

/* #if DEBUG */
export class GUIEmptyScene extends GUIBaseScene {
  constructor(gui: GUIType, target: EmptyScene) {
    super(gui, target)
  }
}
/* #endif */
