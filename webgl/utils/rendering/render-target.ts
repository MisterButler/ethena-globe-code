import {
  HalfFloatType,
  LinearFilter,
  NearestFilter,
  RGBAFormat,
  UnsignedByteType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

import createCanvas from '../common/canvas'

/**
 * Render target helper
 *
 * @export
 * @param {number} [width=1024]
 * @param {number} [height=1024]
 * @param {Object} [options={}]
 * @return {WebGLRenderTarget}
 */
export function createRenderTarget(width = 1024, height = 1024, options: Record<string, unknown> = {}) {
  const defaults = {
    minFilter: LinearFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: UnsignedByteType,
    stencilBuffer: false,
  }
  return new WebGLRenderTarget(width, height, Object.assign({}, defaults, options))
}

/**
 * Output the render targets pixel data to a canvas element
 *
 * @export
 * @class RenderTargetHelper
 */
export class RenderTargetHelper {
  renderTarget: WebGLRenderTarget
  canvas: HTMLCanvasElement
  canvasFlipped: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null
  ctxFlipped: CanvasRenderingContext2D | null
  imageData!: ImageData
  pixelBuffer: Uint8Array | Uint16Array

  constructor(renderTarget: WebGLRenderTarget) {
    this.renderTarget = renderTarget
    const { canvas, ctx } = createCanvas(renderTarget.width, renderTarget.height)
    const { canvas: canvasFlipped, ctx: ctxFlipped } = createCanvas(renderTarget.width, renderTarget.height)
    this.canvas = canvas
    this.ctx = ctx
    this.canvasFlipped = canvasFlipped
    this.ctxFlipped = ctxFlipped
    this.pixelBuffer = new Uint8Array(renderTarget.width * renderTarget.height * 4)
    if (this.ctxFlipped) {
      this.imageData = this.ctxFlipped.createImageData(renderTarget.width, renderTarget.height)
    }
  }

  resize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
    this.canvasFlipped.width = width
    this.canvasFlipped.height = height

    if (this.renderTarget.texture.type === HalfFloatType) {
      this.pixelBuffer = new Uint16Array(width * height * 4)
    } else {
      this.pixelBuffer = new Uint8Array(width * height * 4)
    }

    if (this.ctxFlipped) {
      this.imageData = this.ctxFlipped.createImageData(this.canvas.width, this.canvas.height)
    }
  }

  update(renderer: WebGLRenderer) {
    renderer.readRenderTargetPixels(
      this.renderTarget,
      0,
      0,
      this.renderTarget.width,
      this.renderTarget.height,
      this.pixelBuffer,
    )
    if (!this.ctx || !this.ctxFlipped) {
      return
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.imageData.data.set(this.pixelBuffer)
    this.ctxFlipped.putImageData(this.imageData, 0, 0)
    this.ctx.save()
    this.ctx.scale(1, -1)
    this.ctx.drawImage(this.canvasFlipped, 0, -this.canvas.height, this.canvas.width, this.canvas.height)
    this.ctx.restore()
  }

  reset() {
    if (!this.ctx || !this.ctxFlipped) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctxFlipped.clearRect(0, 0, this.canvasFlipped.width, this.canvasFlipped.height)
  }

  debug(top: number, left: number, scale: number = 1) {
    Object.assign(this.canvas.style, {
      position: 'absolute',
      zIndex: 1000,
      border: '1px solid white',
      pointerEvents: 'none',
      top: `${top || 0}rem`,
      left: `${left || 0}rem`,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    })
    document.body.append(this.canvas)
  }
}
