import { saveAs } from 'file-saver'
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  EulerOrder,
  FloatType,
  HalfFloatType,
  Line,
  LineBasicMaterial,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
} from 'three'

export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// https://stackoverflow.com/questions/8495687/split-array-into-chunks
export function splitArrayIntoChunks<T>(array: Array<T>, chunkSize: number) {
  const size = Math.max(1, chunkSize)

  return array.reduce((resultArray: Array<Array<T>>, item, index) => {
    const chunkIndex = Math.floor(index / size)
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []
    }
    resultArray[chunkIndex].push(item)
    return resultArray
  }, [])
}

export function randomIndex<T>(array: T[], rand: number) {
  return Math.floor(rand * array.length)
}

export function randomItem<T>(array: T[], rand = Math.random()) {
  return array[randomIndex(array, rand)]
}

export function createIncrementedArray(length: number) {
  return Array.from(Array(length).keys())
}

export function copyToClipboard(text: string) {
  try {
    console.log('Copied to clipboard!\n', text)
    navigator.clipboard.writeText(text)
  } catch (err) {
    console.log('Failed to copy to clipboard!\n', err)
  }
}

export function rotateArray<T>(arr: Array<T>, count: number) {
  const len = arr.length
  arr.push(...arr.splice(0, ((-count % len) + len) % len))
  return arr
}

export function saveJsonFile(json: string, filename = 'data') {
  saveAs(
    new File([json], `${filename}.json`, {
      type: 'application/json;charset=utf-8',
    }),
  )
}

export function incrementedArrayFromLength(count: number) {
  return Array.from(Array(count).keys())
}

export function setMatrixAutoUpdate(object: Object3D, children: boolean, autoUpdate: boolean) {
  object.updateMatrixWorld()
  object.matrixAutoUpdate = autoUpdate
  if (children) {
    object.traverse(child => {
      child.matrixAutoUpdate = autoUpdate
    })
  }
}
export type Transform = {
  position: number[]
  rotation: (string | number)[]
  scale: number[]
}

export function setTransform(mesh: Object3D, transform: Transform) {
  mesh.position.fromArray(transform.position)
  mesh.scale.fromArray(transform.scale)
  // Ensure rotation array has numbers and handle potential string for EulerOrder
  const rotation = transform.rotation.slice(0, 3).map(Number) as [number, number, number]
  const eulerOrder = (typeof transform.rotation[3] === 'string' ? transform.rotation[3] : undefined) as
    | EulerOrder
    | undefined

  mesh.rotation.set(rotation[0], rotation[1], rotation[2], eulerOrder)
}

const color = new Color()
const colorLerp0 = new Color()
const colorLerp1 = new Color()

export function hexStringToHexadecimal(hex: string) {
  return color.setStyle(hex).getHex()
}

export function lerpColor(color0: number, color1: number, alpha: number) {
  colorLerp1.setHex(color1)
  return colorLerp0.setHex(color0).lerp(colorLerp1, alpha)
}

export function lerpColorStyle(color0: string, color1: string, alpha: number) {
  colorLerp1.setStyle(color1)
  return colorLerp0.setStyle(color0).lerp(colorLerp1, alpha).getStyle()
}

export function darkenColor(color0: string, alpha: number) {
  return lerpColorStyle(color0, '#000000', alpha)
}

export function createSmoothSpline(positions: Vector3[], totalPoints: number = 10) {
  let curve = new CatmullRomCurve3(positions)
  const points = curve.getPoints(totalPoints)
  curve = new CatmullRomCurve3(points)
  return {
    curve,
    points,
  }
}

export function createLine(vertices: Vector3[], material: LineBasicMaterial) {
  const geometry = new BufferGeometry()
  geometry.setFromPoints(vertices)
  return new Line(geometry, material)
}

export function parentToObject3DWithTransform(child: Object3D, parent: Object3D) {
  const meshWorldMatrix = parent.matrixWorld

  // Step 1: Get the camera's world position and quaternion.
  const worldPosition = new Vector3()
  const worldQuaternion = new Quaternion()

  child.getWorldPosition(worldPosition)
  child.getWorldQuaternion(worldQuaternion)

  // Step 2: Compute the camera's local position and orientation relative to the mesh.
  const localPosition = new Vector3()
  const localQuaternion = new Quaternion()
  const meshInverseMatrix = new Matrix4().copy(meshWorldMatrix).invert()

  // Extract the rotation from the mesh's world matrix
  const meshWorldRotation = new Quaternion()
  const meshScale = new Vector3()
  meshWorldMatrix.decompose(new Vector3(), meshWorldRotation, meshScale)

  // Compute local position
  localPosition.copy(worldPosition).applyMatrix4(meshInverseMatrix)

  // Compute local quaternion
  localQuaternion.copy(worldQuaternion).premultiply(meshWorldRotation.invert())

  // Step 3: Parent the camera to the mesh.
  parent.add(child)

  // Step 4: Apply the local transform to the camera.
  child.position.copy(localPosition)
  child.quaternion.copy(localQuaternion)
}

export function getFloatFormat() {
  return /(Android|iPad|iPhone|iPod)/g.test(navigator.userAgent) ? HalfFloatType : FloatType
}
