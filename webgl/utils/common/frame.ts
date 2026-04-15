import { Line, Mesh, Object3D, PerspectiveCamera, Vector3 } from 'three'

import GUIController from '../editor/gui/gui'
import { GUIType } from '../editor/gui/gui-types'
import { getScaleFromCamera } from './math'
import { createPoint } from './point'

export type FrameData = {
  coord: number[]
}

export default class Frame extends Object3D {
  name = 'Frame'
  helper?: Line
  corners = {
    topLeft: new Vector3(),
    bottomRight: new Vector3(),
    bottomLeft: new Vector3(),
    topRight: new Vector3(),
  }
  pointHelper?: Object3D
  cornerHelpers = [
    createPoint(new Vector3(), 0.1),
    createPoint(new Vector3(), 0.1),
    createPoint(new Vector3(), 0.1),
    createPoint(new Vector3(), 0.1),
  ]
  tmp0 = new Vector3()
  tmp1 = new Vector3()
  coord = new Vector3(0.5, 0.5, 0)
  objectPosition = new Vector3()

  constructor(
    public mesh: Mesh,
    public debug = false,
  ) {
    super()

    if (this.debug) {
      this.pointHelper = createPoint(new Vector3(), 0.1, 0xff0000)
      this.pointHelper.name = 'PointHelper'
      this.add(this.pointHelper)

      this.cornerHelpers.forEach(helper => {
        this.add(helper)
      })
    }
  }

  update(camera: PerspectiveCamera) {
    const { scaleX, scaleY } = getScaleFromCamera(
      camera.projectionMatrix,
      camera.aspect,
      Math.abs(camera.position.distanceTo(this.mesh.position)),
    )
    this.mesh.scale.setScalar(Math.max(scaleX, scaleY))

    // Get mesh world matrix
    this.mesh.updateMatrixWorld(true)

    const positionAttr = this.mesh.geometry.getAttribute('position')
    if (!positionAttr) return

    const vertex = new Vector3()
    let minX = Infinity,
      maxX = -Infinity
    let minY = Infinity,
      maxY = -Infinity

    // Iterate through vertices, transform to world space
    let meshZ = 0
    for (let i = 0; i < positionAttr.count; i++) {
      vertex.fromBufferAttribute(positionAttr, i)
      this.mesh.localToWorld(vertex)

      // Find min/max bounds
      minX = Math.min(minX, vertex.x)
      maxX = Math.max(maxX, vertex.x)
      minY = Math.min(minY, vertex.y)
      maxY = Math.max(maxY, vertex.y)

      // Use the actual z position from the transformed vertex
      if (i === 0) meshZ = vertex.z
    }

    // Assign world-space corners using the actual mesh z position
    this.corners.topLeft.set(minX, maxY, meshZ)
    this.corners.bottomRight.set(maxX, minY, meshZ)
    this.corners.bottomLeft.set(this.corners.topLeft.x, this.corners.bottomRight.y, meshZ)
    this.corners.topRight = new Vector3(this.corners.bottomRight.x, this.corners.topLeft.y, meshZ)

    // Position the block at the center
    if (this.pointHelper) {
      this.pointHelper.position.lerpVectors(this.corners.topLeft, this.corners.bottomRight, 0.5)
    }

    // Compute the object position
    this.tmp0.copy(this.corners.topLeft).lerp(this.corners.topRight, this.coord.x)
    this.tmp1.copy(this.corners.bottomLeft).lerp(this.corners.bottomRight, this.coord.x)
    this.objectPosition.copy(this.tmp0).lerp(this.tmp1, this.coord.y)
    this.objectPosition.z = this.mesh.position.z

    if (this.pointHelper) {
      this.pointHelper.position.copy(this.objectPosition)
    }

    // Update corner helpers
    this.cornerHelpers[0].position.copy(this.corners.topLeft)
    this.cornerHelpers[1].position.copy(this.corners.bottomRight)
    this.cornerHelpers[2].position.copy(this.corners.bottomLeft)
    this.cornerHelpers[3].position.copy(this.corners.topRight)
  }

  updateFrameLine() {
    if (!this.helper) return
  }
}

/// #if DEBUG
export class GUIFrame extends GUIController {
  constructor(gui: GUIType, target: Frame) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Frame' })

    this.gui.addBinding(target, 'coord', {
      //
      x: { min: -0.5, max: 1.5 },
      y: { min: -0.5, max: 1.5 },
      z: { min: 0, max: 100 },
    })
  }
}
/// #endif
