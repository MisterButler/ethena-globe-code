import { Vector2, WebGLRenderer } from 'three'

/**
 * Compute the new width and height based on the squared maximum pixel resolution
 *
 * @param {number} windowWidth
 * @param {number} windowHeight
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @return {*}  {{ width: number, height: number }}
 */
export function resizeWithConstraint(
  windowWidth: number,
  windowHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const baseSize = Math.sqrt(maxWidth * maxHeight)
  const maxSize = baseSize * baseSize
  let width = windowWidth
  let height = windowHeight
  if (windowWidth * windowHeight > maxSize) {
    const ratio = height / width
    width = baseSize
    height = Math.floor(baseSize * ratio)
    const newSize = width * height
    const scalar = Math.sqrt(maxSize / newSize)
    width = Math.floor(width * scalar)
    height = Math.floor(height * scalar)
  }
  return {
    width,
    height,
  }
}

const renderSize = new Vector2()
export function getRenderBufferSize(renderer: WebGLRenderer): {
  width: number
  height: number
} {
  const pixelRatio = renderer.getPixelRatio()
  renderer.getSize(renderSize)
  return {
    width: renderSize.x * pixelRatio,
    height: renderSize.y * pixelRatio,
  }
}
