import gsap from 'gsap'
import { Color, Vector2, WebGLRenderer } from 'three'

import { AppStateEvent, stateManager } from '../../app-state'
import Background, { GUIBackground } from '../../objects/background/background'
import GlobePlane, { GUIGlobePlane } from '../../objects/globe/globe-plane'
import GlobeScene, { GUIGlobeScene } from '../../objects/globe/globe-scene'
import renderManager from '../../rendering/render-manager'
import settings from '../../settings'
import { WebGLSceneId } from '../../types/types-webgl'
import BaseScene, { GUIBaseScene } from '../base-scene/base-scene'
import BookmarkManager, { GUIBookmarkManager } from '@/webgl/utils/common/bookmark-manager'
import { detect } from '@/webgl/utils/common/detect'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import LandingPass from '@/webgl/utils/post-processing/landing-pass/landing-pass'
import { getRenderBufferSize } from '@/webgl/utils/rendering/rendering'

const CREATE_GLOBE = true
const CREATE_BACKGROUND = true
const DEBUG_GLOBE = false

export default class LandingScene extends BaseScene {
  globeScene!: GlobeScene
  globePlane!: GlobePlane
  background!: Background
  landingPass!: LandingPass
  bookmarkManager!: BookmarkManager

  constructor(public renderer: WebGLRenderer) {
    super(
      {
        controls: { dev: true, main: false },
        id: WebGLSceneId.Landing,
        preloadGPU: true,
      },
      renderer,
    )

    this.cameras.main.position.set(0, 0, 2)
    this.cameras.main.lookAt(0, 0, 0)

    if (this.controls.main instanceof OrbitControls) {
      this.controls.main.enableDamping = true
      this.controls.main.target.set(0, 0, 0)
    }

    this.bookmarkManager = new BookmarkManager('main', this.cameras.dev, this.controls.dev)
  }

  async create() {
    await super.create()

    if (CREATE_BACKGROUND) {
      this.background = new Background(this.renderer)
      this.scene.add(this.background)

      this.background.play(1)
    }

    if (CREATE_GLOBE) {
      this.globeScene = new GlobeScene(this.renderer)
      this.globePlane = new GlobePlane(this.renderer)

      if (DEBUG_GLOBE) {
        this.scene.add(this.globeScene.scene)
      } else {
        this.scene.add(this.globePlane)
      }

      this.globeScene.globe.play()
    }

    const { height: renderBufferHeight, width: renderBufferWidth } = getRenderBufferSize(this.renderer)

    if (CREATE_GLOBE) {
      this.landingPass = new LandingPass(
        new Vector2(renderBufferWidth, renderBufferHeight),
        this.scene,
        this.cameras.main,
        this.globeScene,
        this.globePlane,
      )

      if (!DEBUG_GLOBE) {
        renderManager.postProcessing.insertPass(this.landingPass, 1)
      }
    }

    renderManager.show()
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

  resize(width: number, height: number) {
    super.resize(width, height)

    const { height: renderBufferHeight, width: renderBufferWidth } = getRenderBufferSize(this.renderer)

    if (CREATE_GLOBE) {
      this.landingPass.setSize(renderBufferWidth, renderBufferHeight)

      this.globeScene.globe.visible = window.innerWidth > 1150 && detect.device.desktop
    }

    this.background.resize()
  }

  onStateChange = (event: AppStateEvent['change'], _bypass = false) => {}

  update(): void {
    super.update()

    if (CREATE_GLOBE) {
      this.globeScene?.update()
      this.globePlane?.update(this.camera)
    }

    this.background?.update(this.cameras.main)

    if (CREATE_GLOBE && !DEBUG_GLOBE) {
      renderManager.renderpass.enabled = settings.debugCamera
      this.landingPass.enabled = !settings.debugCamera
      this.globePlane.globeViewportMesh.visible = settings.debugCamera
    }
  }

  setGlobeVisible(visible: boolean) {
    if (this.globeScene) {
      this.globeScene.globe.visible = visible
    }
    if (this.globePlane) {
      this.globePlane.visible = visible
    }
  }

  setBackgroundVisible(visible: boolean) {
    if (this.background) {
      this.background.visible = visible
    }
  }

  setGlobeSize(scale: number) {
    if (this.globePlane) {
      this.globePlane.globeViewportMesh.scale.setScalar(scale)
    }
  }

  private currentStyle: 'default' | 'classic' = 'default'
  private outerGlow = 1

  setGlobeStyle(style: 'default' | 'classic') {
    const globe = this.globeScene?.globe
    if (!globe) return

    this.currentStyle = style

    const land = globe.land?.mesh.material.uniforms
    const vignette = globe.vignette?.material.uniforms

    if (style === 'classic') {
      land?.landColor.value.set(new Color(0x0e0f12))
      land?.seaColor.value.set(new Color(0x0c0c0c))
      land?.rimColor.value.set(new Color(0x202939))
      land?.lightColor.value.set(new Color(0x596f9c))
      if (vignette) vignette.color.value.set(new Color(0x202939))
    } else {
      land?.landColor.value.set(new Color(0x1d2332))
      land?.seaColor.value.set(new Color(0x141a26))
      land?.rimColor.value.set(new Color(0x2a3650))
      land?.lightColor.value.set(new Color(0x6b84b5))
      if (vignette) vignette.color.value.set(new Color(0x7d92b9))
    }

    this.applyOuterGlow()
  }

  setGlobeGlow(value: number) {
    const globe = this.globeScene?.globe
    const land = globe?.land?.mesh.material.uniforms
    if (land) land.lightBrightness.value = value
  }

  setOuterGlow(value: number) {
    this.outerGlow = value
    this.applyOuterGlow()
  }

  private applyOuterGlow() {
    const globe = this.globeScene?.globe
    const vignette = globe?.vignette?.material.uniforms
    const inner = globe?.vignette?.inner.uniforms
    // Outer mesh opacity maxes at 1. Inner rim is only present in 'default' style
    // (classic = single-mesh look) with a baseline of 0.6.
    const innerBase = this.currentStyle === 'default' ? 0.6 : 0
    if (vignette) {
      // Vignette.play() tweens opacity 0→1 over 3s; kill to avoid it
      // overriding the user's slider target during that window.
      gsap.killTweensOf(vignette.opacity)
      vignette.opacity.value = this.outerGlow
    }
    if (inner) {
      gsap.killTweensOf(inner.opacity)
      inner.opacity.value = innerBase * this.outerGlow
    }
  }

  setGlobeRotationSpeed(value: number) {
    const globe = this.globeScene?.globe
    if (globe) globe.rotationSpeed = value
  }

  setTransactionLinesVisible(visible: boolean) {
    const globe = this.globeScene?.globe
    if (!globe?.orbitingLines) return
    globe.orbitingLines.visible = visible
    if (visible) globe.orbitingLines.play()
    else globe.orbitingLines.stop()
  }

  setCoastlinesVisible(visible: boolean) {
    this.globeScene?.globe?.setCoastlinesVisible(visible)
  }
}

/* #if DEBUG */
export class GUILandingScene extends GUIBaseScene {
  constructor(gui: GUIType, target: LandingScene) {
    super(gui, target)

    if (target.background) {
      this.controllers.background = new GUIBackground(gui, target.background)
    }

    if (target.globePlane) {
      this.controllers.globePlane = new GUIGlobePlane(gui, target.globePlane)
    }

    if (target.globeScene) {
      this.controllers.globeScene = new GUIGlobeScene(gui, target.globeScene)
    }

    this.controllers.bookmarkManager = new GUIBookmarkManager(gui, target.bookmarkManager)
  }
}
/* #endif */
