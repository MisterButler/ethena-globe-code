import Stats from 'stats-gl'
import {
  EventDispatcher,
  LinearToneMapping,
  MathUtils,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector4,
  WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'

import { AppStateEvent, stateManager } from '../app-state'
import { WebGLScene } from '../scenes/base-scene/base-scene'
import EmptyScene from '../scenes/empty-scene/empty-scene'
import settings from '../settings'
import { Quality } from '../types/types-webgl'
import FrameRateUtil, { GUIFramerate } from '@/webgl/utils/common/frame-rate'
import Screenshot, { GUIScreenshot } from '@/webgl/utils/common/screenshot'
import {
  bloomPassBinding,
  fxaaPassBinding,
  vignettePassBinding,
} from '@/webgl/utils/editor/bindings/gui-post-processing-bindings'
import GUIController from '@/webgl/utils/editor/gui/gui'
import guiEvents, { GUIEditorEvent, GUIEvent } from '@/webgl/utils/editor/gui/gui-events'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import GUIRendererController from '@/webgl/utils/editor/gui/renderer/gui-renderer'
import { getRenderBufferSize, resizeWithConstraint } from '@/webgl/utils/rendering/rendering'

export interface RenderManagerEvent {
  update: object
}

export class RenderManager extends EventDispatcher<RenderManagerEvent> {
  renderer!: WebGLRenderer
  postProcessing!: EffectComposer
  viewport = { debug: new Vector4(), main: new Vector4() }
  windowSize = new Vector2(window.innerWidth, window.innerHeight)
  resolution = new Vector2(1, 1)
  viewportPreviewScale = 0.25
  scene!: WebGLScene

  // Passes
  renderpass!: RenderPass
  fxaaPass!: ShaderPass
  outputPass!: OutputPass
  copyPass!: ShaderPass
  copyPassToRenderTarget!: ShaderPass
  bloomPass!: UnrealBloomPass
  vignettePass!: ShaderPass

  // Utils
  frameRate = new FrameRateUtil()
  screenshot!: Screenshot
  stats!: Stats
  settings = {
    stats: process.env.NODE_ENV === 'development',
  }

  qualitySettings: {
    [key: string]: { resolution: Vector2; pixelRatio: number }
  } = {
    [Quality.High]: {
      pixelRatio: MathUtils.clamp(window.devicePixelRatio, 1, 2),
      resolution: new Vector2(1920, 1080),
    },
    [Quality.Medium]: {
      pixelRatio: MathUtils.clamp(window.devicePixelRatio, 1, 2),
      resolution: new Vector2(1920, 1080),
    },
  }

  setup(renderer: WebGLRenderer, postProcessing: EffectComposer) {
    this.renderer = renderer
    this.postProcessing = postProcessing
    this.renderer.toneMapping = LinearToneMapping
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.shadowMap.enabled = true
    this.renderer.info.autoReset = false
    this.renderer.setClearColor(0x000000)
    this.renderer.setScissorTest(true)
    this.renderer.toneMappingExposure = 1

    if (process.env.NODE_ENV === 'development') {
      this.renderer.debug.checkShaderErrors = true
    }

    this.scene = new EmptyScene(this.renderer, 'empty')

    this.renderpass = new RenderPass(this.scene.scene, this.scene.cameras.main)
    this.fxaaPass = new ShaderPass(FXAAShader)

    this.bloomPass = new UnrealBloomPass(this.resolution, 0.25, 1, 1)
    this.vignettePass = new ShaderPass(VignetteShader)
    this.vignettePass.uniforms.offset.value = 0.8
    this.vignettePass.uniforms.darkness.value = 1.5
    this.bloomPass.enabled = true
    this.vignettePass.enabled = false

    this.outputPass = new OutputPass()

    this.copyPass = new ShaderPass(CopyShader)
    this.copyPassToRenderTarget = new ShaderPass(CopyShader)

    this.postProcessing.addPass(this.renderpass)
    this.postProcessing.addPass(this.fxaaPass)
    this.postProcessing.addPass(this.bloomPass)
    this.postProcessing.addPass(this.outputPass)
    this.postProcessing.addPass(this.vignettePass)

    if (this.settings.stats) {
      this.stats = new Stats({
        horizontal: false,
        logsPerSecond: 20,
        minimal: false,
        mode: 0,
        precision: 2,
        samplesGraph: 10,
        samplesLog: 100,
      })

      this.stats.init(this.renderer.domElement)
      // document.body.appendChild(this.stats.dom);
    }

    this.screenshot = new Screenshot(renderer, 1024, 1024, 2, this.scene.scene, this.scene.cameras.main)

    this.screenshot.drawCanvasFromEffectComposer = this.drawCanvasFromEffectComposer

    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost)

    stateManager.addEventListener('change', this.onStateChange)

    stateManager.trigger((event: AppStateEvent['change']) => {
      this.onStateChange(event, true)
    })

    // When edit mode is activated we switch to dev camera
    guiEvents.addEventListener(GUIEditorEvent.ViewportEditModeChanged, this.onViewportEditModeChange)

    this.hide()
  }

  drawCanvasFromEffectComposer = () => {
    const camera = settings.debugCamera ? this.scene.cameras.dev : this.scene.cameras.main

    const { height: renderBufferHeight, width: renderBufferWidth } = getRenderBufferSize(this.renderer)

    // Cache values
    const aspect = camera.aspect
    const pixelRatio = this.renderer.getPixelRatio()
    // Update properties for the screenshot resolution
    camera.aspect = this.screenshot.width / this.screenshot.height
    camera.updateProjectionMatrix()

    this.fxaaPass.material.uniforms.resolution.value.x = 1 / (this.screenshot.width * this.screenshot.pixelRatio)

    this.fxaaPass.material.uniforms.resolution.value.y = 1 / (this.screenshot.height * this.screenshot.pixelRatio)

    this.postProcessing.setSize(this.screenshot.width, this.screenshot.height)
    this.postProcessing.setPixelRatio(this.screenshot.pixelRatio)
    // Rendering start
    this.postProcessing.addPass(this.copyPass)
    this.postProcessing.render()

    this.copyPassToRenderTarget.render(
      this.renderer,
      this.screenshot.renderTarget,
      this.postProcessing.writeBuffer,
      0,
      false,
    )

    this.screenshot.renderTargetHelper.update(this.renderer)
    this.postProcessing.removePass(this.copyPass)
    // Rendering end
    // Restore original values
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    this.fxaaPass.material.uniforms.resolution.value.x = 1 / renderBufferWidth
    this.fxaaPass.material.uniforms.resolution.value.y = 1 / renderBufferHeight
    this.postProcessing.setSize(this.windowSize.x, this.windowSize.y)
    this.postProcessing.setPixelRatio(pixelRatio)

    // Draw render target helpers canvas to the screenshot canvas
    if (this.screenshot.ctx) {
      this.screenshot.canvas.width = this.screenshot.width
      this.screenshot.canvas.height = this.screenshot.height

      this.screenshot.ctx.drawImage(
        this.screenshot.renderTargetHelper.canvas, //
        0,
        0,
        this.screenshot.canvas.width,
        this.screenshot.canvas.height,
      )
    }
  }

  onViewportEditModeChange = (event: GUIEvent[GUIEditorEvent.ViewportEditModeChanged]) => {
    settings.debugCamera = event.edit
  }

  onStateChange = (event: AppStateEvent['change'], bypass = false) => {
    if (event.state.quality !== event.prev.quality || bypass) {
      this.resize(this.windowSize.x, this.windowSize.y)
    }
  }

  resize(screenWidth: number, screenHeight: number) {
    const qualitySettings = this.qualitySettings[stateManager.state.quality]

    let { height, width } = resizeWithConstraint(
      screenWidth,
      screenHeight,
      qualitySettings.resolution.x,
      qualitySettings.resolution.y,
    )

    if (settings.maxResolution) {
      width = screenWidth
      height = screenHeight
    }

    // Update resolution
    this.resolution.set(width, height)
    this.windowSize.set(screenWidth, screenHeight)

    // Scissor
    this.viewport.debug.set(
      0,
      0,
      this.resolution.x * this.viewportPreviewScale,
      this.resolution.y * this.viewportPreviewScale,
    )

    this.viewport.main.set(0, 0, this.resolution.x, this.resolution.y)

    // Pixel ratio
    this.postProcessing.setPixelRatio(qualitySettings.pixelRatio)
    this.renderer.setPixelRatio(qualitySettings.pixelRatio)

    // Resize passes
    // this.bloomPass.setSize(width, height);
    this.renderer.setSize(width, height)
    this.postProcessing.setSize(width, height)

    // Update uniforms
    const { height: renderBufferHeight, width: renderBufferWidth } = getRenderBufferSize(this.renderer)

    this.fxaaPass.material.uniforms.resolution.value.x = 1 / renderBufferWidth
    this.fxaaPass.material.uniforms.resolution.value.y = 1 / renderBufferHeight

    // Scene resize
    this.scene.resize(width, height)

    // Update DOM
    this.renderer.domElement.style.width = `${screenWidth}px`
    this.renderer.domElement.style.height = `${screenHeight}px`
  }

  setScene(scene: WebGLScene) {
    this.scene = scene
  }

  renderScene = (scene: Scene, camera: PerspectiveCamera, viewport: Vector4, delta: number) => {
    this.renderer.setViewport(viewport)
    this.renderer.setScissor(viewport)
    this.renderpass.scene = scene
    this.renderpass.camera = camera
    this.postProcessing.render(delta)
  }

  afterRender = () => {
    this.scene.afterRender()
  }

  render(delta: number) {
    if (this.frameRate.update()) {
      if (this.settings.stats) {
        this.stats.begin()
      }

      this.scene.update(delta)

      if (settings.debugCamera) {
        this.fxaaPass.enabled = true

        this.renderScene(
          this.scene.scene, //
          this.scene.cameras.dev,
          this.viewport.main,
          delta,
        )

        // Preview render for main camera
        if (settings.renderPreview) {
          this.fxaaPass.enabled = false

          this.renderScene(
            this.scene.scene, //
            this.scene.cameras.main,
            this.viewport.debug,
            delta,
          )
        }
      } else {
        this.fxaaPass.enabled = true

        this.renderScene(
          this.scene.scene, //
          this.scene.cameras.main,
          this.viewport.main,
          delta,
        )
      }

      this.afterRender()

      if (this.settings.stats) {
        this.dispatchEvent({ type: 'update' })
        this.stats.end()
        this.stats.update()
        this.renderer.info.reset()
      }
    }
  }

  loseContext = () => {
    renderManager.renderer.forceContextLoss()
  }

  onContextLost = (_event: Event) => {}

  dispose() {
    this.renderer.dispose()
  }

  hide() {
    this.renderer.domElement.style.opacity = '0'
  }

  show() {
    this.renderer.domElement.style.opacity = '1'
  }
}

const renderManager = new RenderManager()

export default renderManager

/* #if DEBUG */
export class GUIRenderManager extends GUIController {
  constructor(gui: GUIType, target: RenderManager) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Render Manager' })

    this.controllers.renderer = new GUIRendererController(this.gui)

    this.controllers.renderer.gui
      .addButton({
        label: '',
        title: 'Simulate Context Loss',
      })
      .on('click', target.loseContext)

    this.controllers.screenshot = new GUIScreenshot(this.gui, target.screenshot)

    this.controllers.frameRate = new GUIFramerate(this.gui, target.frameRate)

    this.folders.passes = this.addFolder(this.gui, { title: 'Passes' })

    this.folders.fxaa = this.addFolder(this.folders.passes, { title: 'FXAA' })
    fxaaPassBinding(this.folders.fxaa, target.fxaaPass)

    this.folders.bloom = this.addFolder(this.folders.passes, {
      title: 'Bloom',
    })

    bloomPassBinding(this.folders.bloom, target.bloomPass)

    this.folders.vignette = this.addFolder(this.folders.passes, {
      title: 'Vignette',
    })

    vignettePassBinding(this.folders.vignette, target.vignettePass)
  }
}
/* #endif */
