import gsap from 'gsap'
import { Clock, EventDispatcher, WebGLRenderer, WebGLRendererParameters } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'

import GUIController from '../utils/editor/gui/gui'
import { GUIType } from '../utils/editor/gui/gui-types'
import GUISceneController from '../utils/editor/gui/scene/gui-scene'
import GUIRenderStats from '../utils/render-stats'
import Time from '@/webgl/utils/common/time'

import { AppStateEvent, AppStateOptions, GUIAppStateManager, stateManager } from './app-state'
import assetManager from './loading/asset-manager'
import renderManager, { GUIRenderManager } from './rendering/render-manager'
import SceneManager, { GUISceneManager } from './scenes/scene-manager'
import settings, { GUISettingsManager } from './settings'
import { WebGLSceneId } from './types/types-webgl'

export default class WebGLApp extends EventDispatcher {
  clock: Clock = new Clock(true)
  delta = 0
  rafId = 0
  isRendering = false
  initialized = false
  scrollElement?: HTMLElement | null

  renderer: WebGLRenderer
  postProcessing: EffectComposer
  sceneManager: SceneManager

  constructor(parent: HTMLElement, glContext?: WebGL2RenderingContext) {
    super()

    const params: WebGLRendererParameters = {
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    }

    this.renderer = new WebGLRenderer(params)

    if (glContext && glContext.canvas instanceof HTMLCanvasElement) {
      params.canvas = glContext.canvas
      parent.appendChild(glContext.canvas)
    }

    this.renderer = new WebGLRenderer(params)

    if (!glContext) {
      parent.appendChild(this.renderer.domElement)
    }

    this.postProcessing = new EffectComposer(this.renderer)

    renderManager.setup(this.renderer, this.postProcessing)
    this.sceneManager = new SceneManager(this.renderer)

    assetManager.setup(this.renderer, settings.baseUrl)

    stateManager.addEventListener('change', this.onStateChange)

    stateManager.trigger((event: AppStateEvent['change']) => {
      this.onStateChange(event, true)
    })
  }

  onValuesChange(values: AppStateOptions) {
    stateManager.setState(values)
  }

  onStateChange = (_event: AppStateEvent['change'], _init?: boolean) => {} // eslint-disable-line @typescript-eslint/no-unused-vars

  resize = (width: number, height: number) => {
    renderManager.resize(width, height)
  }

  render = (render: boolean) => {
    if (this.isRendering === render) return
    this.isRendering = render

    if (render) {
      this.update()
    } else {
      cancelAnimationFrame(this.rafId)
    }
  }

  update = () => {
    this.rafId = requestAnimationFrame(this.update)
    Time.update()
    renderManager.render(this.clock.getDelta())
  }

  async setScene(sceneID: WebGLSceneId) {
    await this.sceneManager.changeScene(sceneID)
  }

  transition(animateIn: boolean) {
    if (animateIn) {
      this.render(true)
    }

    // animate opacity of the canvas
    gsap.to(this.renderer.domElement, {
      autoAlpha: animateIn ? 1 : 0,
      duration: 1,
      onComplete: () => {
        if (!animateIn) {
          this.render(false)
        }
      },
    })
  }

  onElementInViewport(isVisible: boolean) {
    this.render(isVisible)
  }

  dispose() {
    this.sceneManager.dispose()
    renderManager.dispose()
  }
}

/* #if DEBUG */
export class GUIWebGLApp extends GUIController {
  constructor(
    public leftPanel: GUIType,
    public rightPanel: GUIType,
    public target: WebGLApp,
  ) {
    super(rightPanel)

    GUIController.state.renderer = target.renderer
    GUIController.state.camera = target.sceneManager.scene.cameras.dev
    GUIController.state.scene = target.sceneManager.scene.scene
    GUIController.state.controls = target.sceneManager.scene.controls.dev
    GUIController.state.activeObject = target.sceneManager.scene.scene

    // Right
    this.controllers.settingsManager = new GUISettingsManager(rightPanel, settings)
    this.controllers.renderManager = new GUIRenderManager(rightPanel, renderManager)

    if (renderManager.settings.stats) {
      const renderStats = new GUIRenderStats(rightPanel, renderManager.renderer, renderManager.stats)
      renderManager.addEventListener('update', renderStats.update)
    }

    this.controllers.stateManager = new GUIAppStateManager(rightPanel, stateManager)
    this.controllers.sceneManager = new GUISceneManager(rightPanel, target.sceneManager)

    // Left
    this.controllers.sceneController = new GUISceneController(leftPanel)
  }

  get scene() {
    return this.controllers.sceneManager.controllers.scene.gui
  }
}
/* #endif */
