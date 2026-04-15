import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

import Frame, { GUIFrame } from '@/webgl/utils/common/frame'
import { worldToScreenCoordinates } from '@/webgl/utils/common/math'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'

export default class GlobePlane extends Group {
  name = 'GlobePlane'
  frameMesh: Mesh
  globeViewportMesh: Mesh
  frame: Frame
  screenCoords = new Vector2()

  // Cached objects for getViewportBounds to avoid GC
  private _corners: Vector3[] = [
    new Vector3(-0.5, 0.5, 0), // top left
    new Vector3(0.5, 0.5, 0), // top right
    new Vector3(-0.5, -0.5, 0), // bottom left
    new Vector3(0.5, -0.5, 0), // bottom right
  ]
  private _screenCorners: Vector2[] = [new Vector2(), new Vector2(), new Vector2(), new Vector2()]
  private _tempCorner = new Vector3()
  private _minValues = { x: 0, y: 0 }
  private _maxValues = { x: 0, y: 0 }

  constructor(public renderer: WebGLRenderer) {
    super()

    this.frameMesh = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
      }),
    )

    this.frameMesh.visible = false
    this.frameMesh.name = 'Frame'
    this.add(this.frameMesh)

    this.frame = new Frame(this.frameMesh, false)
    this.frame.coord.set(0.5, 0.5, 0)
    this.add(this.frame)

    this.globeViewportMesh = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        side: DoubleSide,
      }),
    )

    this.globeViewportMesh.scale.setScalar(5)
    this.globeViewportMesh.name = 'globeViewportMesh'
    this.globeViewportMesh.visible = false
    this.add(this.globeViewportMesh)
  }

  update(camera: PerspectiveCamera) {
    this.frame.update(camera)
    this.globeViewportMesh.position.copy(this.frame.objectPosition)
  }

  /**
   * Get the absolute 2D pixel coordinates of the plane mesh
   * @param camera - The camera to project from
   * @param renderer - The WebGL renderer to get canvas dimensions
   * @returns Vector2 with x,y pixel coordinates
   */
  getScreenCoordinates(camera: PerspectiveCamera, renderer: WebGLRenderer): Vector2 {
    const result = new Vector2()

    worldToScreenCoordinates(this.globeViewportMesh.position, camera, renderer, result)

    return result
  }

  /**
   * Get the scale factor of the globe viewport mesh
   * @returns The scale factor as a number
   */
  getViewportScale(): number {
    return this.globeViewportMesh.scale.x // Assuming uniform scaling
  }

  /**
   * Calculate the viewport bounds for rendering based on the mesh's screen coordinates
   * @param camera - The camera to project from
   * @param renderer - The WebGL renderer to get canvas dimensions
   * @returns Object with x, y, width, height for viewport and scale factor
   */
  getViewportBounds(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    // Update mesh world matrix
    this.globeViewportMesh.updateMatrixWorld(true)

    // Transform corners to world space and then to screen coordinates
    // Reuse cached objects to avoid GC
    for (let i = 0; i < 4; i++) {
      // Copy corner to temp vector and transform to world space
      this._tempCorner.copy(this._corners[i])
      this._tempCorner.applyMatrix4(this.globeViewportMesh.matrixWorld)

      // Convert to screen coordinates (reusing cached Vector2)
      worldToScreenCoordinates(this._tempCorner, camera, renderer, this._screenCorners[i])
    }

    // Get pixel ratio and canvas dimensions (cache these values)
    const pixelRatio = renderer.getPixelRatio()
    const canvas = renderer.domElement
    const canvasHeight = canvas.height / pixelRatio

    // Calculate bounds from screen corners using cached min/max objects
    this._minValues.x = this._screenCorners[0].x
    this._minValues.y = this._screenCorners[0].y
    this._maxValues.x = this._screenCorners[0].x
    this._maxValues.y = this._screenCorners[0].y

    // Find min/max without creating arrays
    for (let i = 1; i < 4; i++) {
      const corner = this._screenCorners[i]
      if (corner.x < this._minValues.x) this._minValues.x = corner.x
      if (corner.x > this._maxValues.x) this._maxValues.x = corner.x
      if (corner.y < this._minValues.y) this._minValues.y = corner.y
      if (corner.y > this._maxValues.y) this._maxValues.y = corner.y
    }

    // Convert to CSS pixels
    const minX = this._minValues.x / pixelRatio
    const maxX = this._maxValues.x / pixelRatio
    const minY = this._minValues.y / pixelRatio
    const maxY = this._maxValues.y / pixelRatio

    // Calculate viewport parameters (CSS pixel coordinates)
    // Flip Y coordinate for WebGL's bottom-left origin
    const x = minX
    const y = canvasHeight - maxY // Flip Y coordinate
    const width = maxX - minX
    const height = maxY - minY

    // Don't clamp viewport - let it extend beyond canvas bounds if needed
    return {
      height: height,
      scale: this.getViewportScale(),
      width: width,
      x: x,
      y: y, // Include scale factor for rendering adjustments
    }
  }
}

/* #if DEBUG */
export class GUIGlobePlane extends GUIController {
  constructor(gui: GUIType, target: GlobePlane) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Globe Plane' })

    this.controllers.frame = new GUIFrame(this.gui, target.frame)
  }
}
/* #endif */
