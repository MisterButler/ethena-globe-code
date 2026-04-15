import { VECTOR_ZERO } from '@/webgl/utils/common/math'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { ShaderMaterial, WebGLRenderer } from 'three'

import PreloaderObject from '../../objects/preloader/preloader'
import settings from '../../settings'
import { WebGLSceneId } from '../../types/types-webgl'
import BaseScene, { GUIBaseScene } from '../base-scene/base-scene'

export default class PreloaderScene extends BaseScene {
  material: ShaderMaterial = new ShaderMaterial()
  preloader!: PreloaderObject

  constructor(renderer: WebGLRenderer) {
    super(
      {
        id: WebGLSceneId.Preloader,
        controls: { dev: true, main: false },
        preloadGPU: true,
      },
      renderer,
    )
    this.camera.position.set(0, 0, 10)
    this.camera.lookAt(VECTOR_ZERO)
  }

  async create() {
    await super.create()
    this.preloader = new PreloaderObject()
    this.scene.add(this.preloader)
  }

  preloadGpuCullScene = (culled: boolean) => {
    this.material.uniforms.opacity.value = culled ? 1 : 0
  }

  async animateInit() {
    await super.animateInit()
    this.preloader.animateInit()
  }

  async animateIn() {
    await super.animateIn()
    await new Promise((resolve): Promise<void> | void => {
      if (settings.skipTransitions) {
        resolve(null)
        return
      }
      this.preloader.animateIn().then(resolve)
    })
  }

  async animateOut() {
    await super.animateOut()
    await new Promise((resolve): Promise<void> | void => {
      if (settings.skipTransitions) {
        resolve(null)
        return
      }
      this.preloader.animateOut().then(resolve)
    })
  }

  update(): void {
    super.update()
    this.preloader.update()
  }
}

/* #if DEBUG */
export class GUIPreloaderScene extends GUIBaseScene {
  constructor(gui: GUIType, target: PreloaderScene) {
    super(gui, target)
  }
}
/* #endif */
