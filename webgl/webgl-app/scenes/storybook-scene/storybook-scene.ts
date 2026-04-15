import BookmarkManager, { GUIBookmarkManager } from '@/webgl/utils/common/bookmark-manager'
import { VECTOR_ZERO } from '@/webgl/utils/common/math'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import DirectionalLightObject from '@/webgl/utils/objects/directional-light-object'
import HemisphereLightObject from '@/webgl/utils/objects/hemisphere-light-object'
import { WebGLRenderer } from 'three'

import { AppStateEvent, stateManager } from '../../app-state'
import { WebGLSceneId } from '../../types/types-webgl'
import BaseScene, { GUIBaseScene } from '../base-scene/base-scene'
import renderManager from '../../rendering/render-manager'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls'

export default class StorybookScene extends BaseScene {
  hemisphereLightObject!: HemisphereLightObject
  directionalLightObject!: DirectionalLightObject
  bookmarkManager: BookmarkManager

  constructor(public renderer: WebGLRenderer) {
    super(
      {
        id: WebGLSceneId.Storybook,
        controls: { dev: true, main: true },
        preloadGPU: false,
      },
      renderer,
    )
    this.cameras.main.position.set(0, 0, 2)
    this.cameras.main.lookAt(VECTOR_ZERO)

    if (this.controls.main instanceof OrbitControls) {
      this.controls.main.enableDamping = true
    }

    this.bookmarkManager = new BookmarkManager('storybook', this.cameras.dev, this.controls.dev)
    renderManager.show()
  }

  async create() {
    await super.create()
    // Lights
    this.directionalLightObject = new DirectionalLightObject()
    this.hemisphereLightObject = new HemisphereLightObject()
  }

  async animateIn() {
    stateManager.addEventListener('change', this.onStateChange)
    stateManager.trigger((event: AppStateEvent['change']) => {
      this.onStateChange(event, true)
    })
  }

  async animateOut() {
    stateManager.removeEventListener('change', this.onStateChange)
  }

  onStateChange = (_event: AppStateEvent['change'], _bypass = false) => {}
}

/* #if DEBUG */
export class GUIStorybookScene extends GUIBaseScene {
  constructor(gui: GUIType, target: StorybookScene) {
    super(gui, target)

    this.gui = gui

    this.controllers.bookmarkManager = new GUIBookmarkManager(this.gui, target.bookmarkManager)
  }
}
/* #endif */
