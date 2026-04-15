import { MathUtils, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three'

import { detect } from '@/webgl/utils/common/detect'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls.js'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'

import Globe, { GUIGlobe } from './globe'

const ORBIT_CONTROLS = true

export default class GlobeScene extends Object3D {
  name = 'GlobeScene'
  scene: Scene
  camera = new PerspectiveCamera(40, 1)
  controls?: OrbitControls
  globe: Globe

  settings = {
    distance: 5,
  }

  constructor(public renderer: WebGLRenderer) {
    super()
    this.scene = new Scene()
    this.globe = new Globe(renderer)

    this.scene.add(this.globe)
    this.camera = new PerspectiveCamera()
    this.camera.position.set(0, 0, this.settings.distance)
    this.camera.lookAt(0, 0, 0)

    if (ORBIT_CONTROLS) {
      const element = document.getElementById('globe-section')

      if (element && detect.device.desktop) {
        // Create a dedicated interaction overlay that avoids button areas
        const globeInteractionArea = document.createElement('div')
        globeInteractionArea.id = 'globe-interaction-area'

        globeInteractionArea.style.cssText = `
          position: absolute;
          top: 10%;
          left: 10%;
          width: 80%;
          height: 70%;
          pointer-events: auto;
          z-index: 5;
        `

        element.appendChild(globeInteractionArea)

        this.controls = new OrbitControls(this.camera, globeInteractionArea)

        this.controls.minDistance = this.settings.distance
        this.controls.maxDistance = this.settings.distance
        this.controls.enableDamping = true
        this.controls.enabled = true
        this.controls.enablePan = false
        const range = MathUtils.degToRad(80)
        this.controls.minPolarAngle = range
        this.controls.maxPolarAngle = range
        this.controls.update()
      }
    }

    this.controls?.target.set(0, 0, 0)
  }

  update() {
    this.controls?.update()
    this.globe.update(this.camera)
    // this.globe.update(camera);
  }
}

/// #if DEBUG
export class GUIGlobeScene extends GUIController {
  constructor(gui: GUIType, target: GlobeScene) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Globe Scene' })

    this.controllers.globe = new GUIGlobe(this.gui, target.globe)
  }
}
/// #endif
