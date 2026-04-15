import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from '../../common/OrbitControls'

class folderstate {
  renderer!: WebGLRenderer
  scene!: Scene
  camera!: PerspectiveCamera
  controls!: OrbitControls
  activeObject!: Object3D
}

const state = new folderstate()

export default state
