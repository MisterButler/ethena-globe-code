import { BindingApi } from '@tweakpane/core'
import { saveAs } from 'file-saver'
import {
  LinearFilter,
  NearestFilter,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

import GUIController from '../editor/gui/gui'
import { GUIType } from '../editor/gui/gui-types'
import { clearBindings, generateBindingOptions } from '../editor/gui/gui-utils'
import { RenderTargetHelper } from '../rendering/render-target'
import { getRenderBufferSize } from '../rendering/rendering'
import createCanvas from './canvas'

export enum CaptureMode {
  WebGLRenderer = 'WebGLRenderer',
  EffectComposer = 'EffectComposer',
}

export enum CaptureType {
  Blob = 'Blob',
  DataUrl = 'DataUrl',
}

export enum FileType {
  Jpg = 'jpg',
  Png = 'png',
}

export default class Screenshot {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null
  useRendererSize = false
  _width = 0
  _height = 0
  _pixelRatio = 0
  renderTarget: WebGLRenderTarget
  renderTargetHelper: RenderTargetHelper
  captureMode: CaptureMode = CaptureMode.EffectComposer
  captureType: CaptureType = CaptureType.Blob
  fileType: FileType = FileType.Jpg
  quality: number = 1

  constructor(
    public renderer: WebGLRenderer,
    width: number = 1024,
    height: number = 1024,
    // Supersampling
    pixelRatio: number = 1,
    public scene: Scene,
    public camera: PerspectiveCamera,
  ) {
    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio
    const { canvas, ctx } = createCanvas(width, height)
    this.ctx = ctx
    this.canvas = canvas

    this.renderTarget = new WebGLRenderTarget(this.width * this.pixelRatio, this.height * this.pixelRatio, {
      minFilter: LinearFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      stencilBuffer: false,
    })
    this.renderTargetHelper = new RenderTargetHelper(this.renderTarget)
    // this.renderTargetHelper.debug(1, 1, 0.25);

    // if (debug) {
    //   Object.assign(this.canvas.style, {
    //     position: "absolute",
    //     zIndex: 1000,
    //     border: "1px solid white",
    //     pointerEvents: "none",
    //     top: `1rem`,
    //     left: `1rem`,
    //     transform: "scale(0.5)",
    //     transformOrigin: "top left"
    //   });
    //   document.body.append(this.canvas);
    // }
  }

  // optionally override this method in subclass
  drawCanvasFromWebGLRenderer() {
    if (!this.ctx) return
    const { width, height } = getRenderBufferSize(this.renderer)
    this.canvas.width = width
    this.canvas.height = height
    this.ctx.drawImage(
      this.renderer.domElement, //
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    )
  }

  // override this method in subclass
  drawCanvasFromEffectComposer(_scene: Scene, _camera: PerspectiveCamera) {}

  capture() {
    return new Promise<string | Blob>((resolve, reject) => {
      if (!this.ctx) {
        reject('Canvas context is null')
        return
      }
      if (this.captureMode === CaptureMode.WebGLRenderer) {
        this.drawCanvasFromWebGLRenderer()
      } else {
        this.drawCanvasFromEffectComposer(this.scene, this.camera)
      }

      // Resolve image type
      switch (this.captureType) {
        case CaptureType.Blob: {
          this.canvas.toBlob(
            (blob: Blob | null) => {
              if (blob) {
                resolve(blob)
              } else {
                reject('Failed to create blob')
              }
            },
            this.mineType,
            this.quality,
          )
          break
        }
        default: {
          resolve(this.canvas.toDataURL(this.mineType, this.quality))
          break
        }
      }
    })
  }

  get mineType() {
    return this.fileType === FileType.Jpg ? 'image/jpeg' : 'image/png'
  }

  set width(value: number) {
    this._width = value
  }
  set height(value: number) {
    this._height = value
  }

  set pixelRatio(value: number) {
    this._pixelRatio = value
  }

  get width() {
    return this.useRendererSize ? this.renderer.domElement.width / this.renderer.getPixelRatio() : this._width
  }

  get height() {
    return this.useRendererSize ? this.renderer.domElement.height / this.renderer.getPixelRatio() : this._height
  }

  get pixelRatio() {
    return this.useRendererSize ? this.renderer.getPixelRatio() : this._pixelRatio
  }

  download(blob: Blob | string, filename: string, fileType: FileType) {
    saveAs(blob, `filename-${new Date()}.${fileType === FileType.Jpg ? 'jpg' : 'png'}`)
  }
}

/* #if DEBUG */
export class GUIScreenshot extends GUIController {
  bindings: BindingApi[] = []

  constructor(
    gui: GUIType,
    public target: Screenshot,
  ) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Screenshot' })

    this.api.width = target.renderer.domElement.width
    this.api.height = target.renderer.domElement.height
    this.api.pixelRatio = target.renderer.getPixelRatio()

    const onCaptureModeChange = () => {
      clearBindings(this.bindings)

      const onDimensionsChange = () => {
        const width = target.width * target.pixelRatio
        const height = target.height * target.pixelRatio
        target.renderTarget.setSize(width, height)
        target.renderTargetHelper.resize(width, height)
      }

      if (target.captureMode === CaptureMode.EffectComposer) {
        this.bindings.push(
          this.gui.addBinding(target, 'width', { step: 1 }).on('change', onDimensionsChange),
          this.gui.addBinding(target, 'height', { step: 1 }).on('change', onDimensionsChange),
          this.gui.addBinding(target, 'pixelRatio', { min: 1, max: 4, step: 1 }).on('change', onDimensionsChange),
          this.gui.addBinding(target, 'useRendererSize'),
        )
      } else {
        this.bindings.push(
          this.gui.addBinding(this.api, 'width', { readonly: true }),
          this.gui.addBinding(this.api, 'height', { readonly: true }),
          this.gui.addBinding(this.api, 'pixelRatio', { readonly: true }),
        )
      }
    }

    this.gui
      .addBinding(target, 'captureMode', {
        options: generateBindingOptions(Object.values(CaptureMode)),
      })
      .on('change', onCaptureModeChange)
    this.gui.addBinding(target, 'captureType', {
      options: generateBindingOptions(Object.values(CaptureType)),
    })
    this.gui.addBinding(target, 'fileType', {
      options: generateBindingOptions(Object.values(FileType)),
    })
    this.gui.addBinding(target, 'quality', { min: 0, max: 1 })
    this.gui.addButton({ title: 'capture' }).on('click', () => {
      target
        .capture()
        .then(result => {
          target.download(result, 'screenshot', target.fileType)
        })
        .catch((error: Error) => {
          console.log('error', error)
        })
    })

    onCaptureModeChange()
  }

  resize() {
    this.bindings.forEach(b => b.refresh())
    this.api.width = this.target.renderer.domElement.width
    this.api.height = this.target.renderer.domElement.height
  }
}
/* #endif */
