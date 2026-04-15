import { createPerspectiveCamera, resetCamera } from '@/webgl/utils/common/camera'
import { disposeObjects } from '@/webgl/utils/common/memory'
import GUIController from '@/webgl/utils/editor/gui/gui'
import guiEvents, { GUIEditorEvent } from '@/webgl/utils/editor/gui/gui-events'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import AxesObject from '@/webgl/utils/objects/axes-object'
import GridObject from '@/webgl/utils/objects/grid-object'
import { CameraHelper, EventDispatcher, MathUtils, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three'

import settings from '../../settings'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls.js'

export type SceneOptions = {
  id: string
  clearColor?: number
  controls: {
    dev: boolean
    main: boolean
  }
  preloadGPU: boolean
}

type Controls = {
  dev: OrbitControls
  main?: OrbitControls
}

export interface WebGLScene extends EventDispatcher {
  setup: () => Promise<void>
  animateInit: () => Promise<void>
  animateIn: () => Promise<void>
  animateOut: () => Promise<void>
  dispose: () => void
  scene: Scene
  clearColor: number
  update: (value: number) => void
  id: string
  resize: (width: number, height: number) => void
  cameras: { dev: PerspectiveCamera; main: PerspectiveCamera }
  camera: PerspectiveCamera
  preloadGPU: boolean
  controls: Controls
  isSetup: boolean
  isDisposable: boolean
  afterRender: () => void
  onSettingsChange: () => void
  objects: Object3D[]
}

export default class BaseScene extends EventDispatcher implements WebGLScene {
  scene: Scene = new Scene()
  id: string
  cameras: { dev: PerspectiveCamera; main: PerspectiveCamera }
  clearColor = 0x000000
  camera: PerspectiveCamera
  controls: Controls
  preloadGPU = false
  options: SceneOptions
  settings = {}
  isSetup = false
  isDisposable = true
  scrollProgress = 0
  helpers = new Object3D()
  resizing = false
  resizeTimeoutID!: ReturnType<typeof setTimeout>
  renderer: WebGLRenderer
  objects: Object3D[] = []

  constructor(options: SceneOptions, renderer: WebGLRenderer) {
    super()
    this.renderer = renderer
    this.id = options.id || MathUtils.generateUUID()
    this.scene.name = this.id
    this.clearColor = options.clearColor || 0x000000
    this.preloadGPU = options.preloadGPU || true
    this.options = options
    this.cameras = {
      dev: createPerspectiveCamera(window.innerWidth / window.innerHeight),
      main: createPerspectiveCamera(window.innerWidth / window.innerHeight),
    }

    this.cameras.main.name = 'Main Camera'
    this.cameras.dev.name = 'Debug Camera'

    this.camera = this.cameras.main

    this.scene.add(this.cameras.dev, this.cameras.main)

    resetCamera(this.cameras.dev, 10)
    resetCamera(this.cameras.main, 5)

    this.helpers.name = 'Helpers'

    this.controls = {
      dev: new OrbitControls(this.cameras.dev, renderer.domElement),
    }
    this.controls.dev.update()

    if (options.controls.main) {
      this.controls.main = new OrbitControls(this.cameras.main, renderer.domElement)
      this.controls.main.update()
    }

    settings.addEventListener('change', this.onSettingsChange)
  }

  async create() {}

  async setup() {
    if (this.isSetup) {
      return
    }

    this.helpers.add(
      new AxesObject(),
      new GridObject(),
      // Don't add CameraHelper here - we'll manage it dynamically
    )
    this.scene.add(this.helpers)

    await this.create()

    // if (this.preloadGPU) {
    //   await preloadGPU(this.id, renderer, this.scene, this.camera, 10);
    // }
    this.isSetup = true
    this.onSettingsChange()
  }

  onSettingsChange = () => {
    // Remove existing camera helper
    const existingHelper = this.helpers.children.find(child => child instanceof CameraHelper)
    if (existingHelper) {
      this.helpers.remove(existingHelper)
    }

    // Only add main camera helper when in dev camera mode
    if (settings.debugCamera) {
      const cameraHelper = new CameraHelper(this.cameras.main)
      this.helpers.add(cameraHelper)
    }
  }

  resize(width: number, height: number) {
    this.cameras.dev.aspect = width / height
    this.cameras.dev.updateProjectionMatrix()
    this.cameras.main.aspect = width / height
    this.cameras.main.updateProjectionMatrix()

    this.objects.forEach(object => {
      if (typeof (object as any).resize === 'function') {
        ;(object as any).resize()
      }
    })
  }

  async animateInit() {
    //
  }

  async animateIn() {
    //
  }

  async animateOut() {
    //
  }

  update() {
    this.objects.forEach(object => {
      if (typeof (object as any).update === 'function') {
        ;(object as any).update(this.cameras.main)
      }
    })

    if (this.controls.dev instanceof OrbitControls) {
      this.controls.dev.enabled = settings.debugCamera
      this.controls.dev.update()
    }
    if (this.controls.main instanceof OrbitControls) {
      this.controls.main.enabled = !settings.debugCamera
      this.controls.main.update()
    }

    this.helpers.children.forEach(child => {
      if (child instanceof CameraHelper) {
        child.update()
      }
    })

    this.helpers.visible = settings.helpers
  }

  afterRender() {}

  dispose() {
    if (!this.isDisposable) return
    disposeObjects(this.scene)
  }

  shouldRender() {
    return true
  }
}

/* #if DEBUG */
export class GUIBaseScene extends GUIController {
  constructor(gui: GUIType, _target: BaseScene) {
    super(gui)
  }

  onEntityChanged = () => {
    guiEvents.dispatchEvent({ type: GUIEditorEvent.SceneGraphChanged })
  }
}
/* #endif */
