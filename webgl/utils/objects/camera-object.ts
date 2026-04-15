import { CameraHelper, Object3D, PerspectiveCamera } from 'three'

export default class CameraObject extends Object3D {
  name = 'CameraObject'

  constructor(camera: PerspectiveCamera) {
    super()
    const helper = new CameraHelper(camera)
    camera.name = 'Camera'
    helper.name = 'Camera Helper'
    this.add(camera, helper)
  }
}
