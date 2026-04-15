import { Euler, MathUtils, Matrix4, PerspectiveCamera, Vector2, Vector3, WebGLRenderer } from 'three'

export const TWO_PI = Math.PI * 2
export const PI = Math.PI
export const HALF_PI = Math.PI / 2
export const QUARTER_PI = Math.PI / 4
export const VECTOR_ZERO = new Vector3()
export const VECTOR_ONE = new Vector3(1, 1, 1)
export const VECTOR_UP = new Vector3(0, 1, 0)
export const EULER_ZERO = new Euler(0, 0, 0)

export function randomSpherePoint(x0: number, y0: number, z0: number, radius: number, position: Vector3) {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  position.x = x0 + radius * Math.sin(phi) * Math.cos(theta)
  position.y = y0 + radius * Math.sin(phi) * Math.sin(theta)
  position.z = z0 + radius * Math.cos(phi)
}

export function getFovFromProjectionMatrix(projectionMatrix: Matrix4) {
  return Math.atan(1.0 / projectionMatrix.elements[5]) * 2.0 * MathUtils.RAD2DEG
}

export function getScaleFromCamera(projectionMatrix: Matrix4, aspect: number, distance: number) {
  const scaleY = Math.tan(((getFovFromProjectionMatrix(projectionMatrix) * Math.PI) / 180) * 0.5) * (distance * 2)
  return {
    scaleX: scaleY * aspect,
    scaleY,
  }
}

export function pingPingSin(value: number) {
  return Math.sin(value) * 0.5 + 0.5
}

export function pingPingCos(value: number) {
  return Math.cos(value) * 0.5 + 0.5
}

/**
 * Convert a 3D world position to 2D screen coordinates
 * @param worldPosition - The 3D world position to convert
 * @param camera - The camera to project from
 * @param renderer - The WebGL renderer to get canvas dimensions
 * @returns Vector2 with x,y pixel coordinates
 */
export function worldToScreenCoordinates(
  worldPosition: Vector3,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  target: Vector2 = new Vector2(),
) {
  // Create a temporary vector to avoid modifying the original
  const tempVector = worldPosition.clone()

  // Convert to screen coordinates
  tempVector.project(camera)

  // Convert from normalized device coordinates (-1 to 1) to pixel coordinates
  const canvas = renderer.domElement
  const widthHalf = canvas.width / 2
  const heightHalf = canvas.height / 2

  target.set(tempVector.x * widthHalf + widthHalf, -(tempVector.y * heightHalf) + heightHalf)
}
