import type { Texture } from 'three'
import { TextureLoader } from 'three'

import type { GUIType } from '../gui/gui-types'

const loader = new TextureLoader()

export default class GUICanvasMaterialCommand {
  // HTML ----
  canvas!: HTMLCanvasElement
  index = 0
  img?: number | Blob | undefined
  map?: Texture
  onChangeCallback?: (arg0: Texture) => void

  constructor(
    public gui: GUIType,
    index: number,
    _map: Texture | null,
  ) {
    this.index = index
    if (_map) this.map = _map
    this.initCanvas()
  }
  initCanvas() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 32
    this.canvas.height = 18
    this.canvas.style.cursor = 'pointer'
    this.canvas.style.marginRight = '5px'
    this.canvas.style.border = '1px solid #888'
    this.canvas.style.position = 'absolute'
    this.canvas.style.left = '25px'
    this.canvas.style.top = '0'

    if (this.map) this.drawCanvas(this.map, this.canvas)

    this.canvas.addEventListener('click', () => {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.style.opacity = '0'
      input.style.position = 'fixed'
      document.body.append(input)

      input.addEventListener('input', event => {
        this.img = input.files?.length && input.files[0]
        const file = this.img as Blob
        input.remove()

        if (event.target && /image.*/.test(file.type)) {
          const userImageURL = URL.createObjectURL(file)

          loader.load(userImageURL, texture => {
            this.map = texture
            this.drawCanvas(texture, this.canvas)
            if (this.onChangeCallback) this.onChangeCallback(this.map)
          })
        }
      })

      input.click()
    })

    this.appendCanvas()
  }
  appendCanvas() {
    const container = this.gui.controller.view.element.children[0].children.item(this.index)
    if (container) (container?.children[1] as HTMLDivElement).style.position = 'relative'
    container?.children[1].append(this.canvas)
  }
  drawCanvas(texture: Texture | null, canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')

    // Seems like context can be null if the canvas is not visible
    if (context) {
      // clear the context because new texture may has transparency
      context.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (texture !== null) {
      const image = texture.image

      if (image !== undefined && image !== null && image.width > 0) {
        // const scale = canvas.width / image.width;

        if (image.data === undefined && context) {
          // context?.drawImage(
          //   image,
          //   0,
          //   0,
          //   image.width * scale,
          //   image.height * scale,
          // );
        }
      }
    } else {
      canvas.title = 'empty'
    }
  }

  onChange(callback: ((arg0: Texture) => void) | undefined) {
    this.onChangeCallback = callback
  }
}
