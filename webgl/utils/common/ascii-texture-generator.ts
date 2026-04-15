import { CanvasTexture, NearestFilter } from 'three'

import createCanvas from './canvas'

export interface ASCIITextureOptions {
  /**
   * Width of the texture in characters
   */
  gridWidth: number
  /**
   * Height of the texture in characters
   */
  gridHeight: number
  /**
   * Size of each character cell in pixels
   */
  cellSize: number
  /**
   * Font size for the ASCII characters
   */
  fontSize: number
  /**
   * Font family to use
   */
  fontFamily: string
  /**
   * Characters to randomly select from
   */
  characters: string
  /**
   * Text color
   */
  textColor: string
  /**
   * Background color
   */
  backgroundColor: string
  /**
   * Whether to randomize character positions slightly
   */
  jitter: boolean
  /**
   * Maximum jitter amount (0-1, as fraction of cell size)
   */
  jitterAmount: number
}

const DEFAULT_ASCII_CHARS =
  '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export default class ASCIITextureGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private options: ASCIITextureOptions

  constructor(options: Partial<ASCIITextureOptions> = {}) {
    this.options = {
      gridWidth: 32,
      gridHeight: 32,
      cellSize: 32,
      fontSize: 24,
      fontFamily: 'monospace',
      characters: DEFAULT_ASCII_CHARS,
      textColor: '#ffffff',
      backgroundColor: '#000000',
      jitter: true,
      jitterAmount: 0.2,
      ...options,
    }

    const totalWidth = this.options.gridWidth * this.options.cellSize
    const totalHeight = this.options.gridHeight * this.options.cellSize

    const canvasResult = createCanvas(totalWidth, totalHeight)
    this.canvas = canvasResult.canvas
    this.ctx = canvasResult.ctx!

    if (!this.ctx) {
      throw new Error('Could not create 2D canvas context')
    }
  }

  generateTexture(): CanvasTexture {
    this.drawASCIIGrid()

    const texture = new CanvasTexture(this.canvas)
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter
    texture.generateMipmaps = false
    texture.flipY = false

    return texture
  }

  /**
   * Update the texture with new random characters
   */
  updateTexture(texture: CanvasTexture): void {
    this.drawASCIIGrid()
    texture.needsUpdate = true
  }

  private drawASCIIGrid(): void {
    const { ctx, options } = this
    const {
      gridWidth,
      gridHeight,
      cellSize,
      fontSize,
      fontFamily,
      characters,
      textColor,
      backgroundColor,
      jitter,
      jitterAmount,
    } = options

    // Clear and fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Set up text rendering
    ctx.fillStyle = textColor
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Draw each character in the grid
    let charIndex = 0
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        // Use characters in sequence, cycling through if we have more grid cells than characters
        const char = characters[charIndex % characters.length]
        charIndex++

        // Calculate base position (center of cell)
        let posX = (x + 0.5) * cellSize
        let posY = (y + 0.5) * cellSize

        // Apply jitter if enabled
        if (jitter) {
          const jitterX = (Math.random() - 0.5) * jitterAmount * cellSize
          const jitterY = (Math.random() - 0.5) * jitterAmount * cellSize
          posX += jitterX
          posY += jitterY
        }

        ctx.fillText(char, posX, posY)
      }
    }
  }

  updateOptions(newOptions: Partial<ASCIITextureOptions>): void {
    this.options = { ...this.options, ...newOptions }

    // Resize canvas if grid dimensions changed
    const totalWidth = this.options.gridWidth * this.options.cellSize
    const totalHeight = this.options.gridHeight * this.options.cellSize

    if (this.canvas.width !== totalWidth || this.canvas.height !== totalHeight) {
      this.canvas.width = totalWidth
      this.canvas.height = totalHeight
    }
  }

  getOptions(): ASCIITextureOptions {
    return { ...this.options }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}

export function createASCIITexture(options: Partial<ASCIITextureOptions> = {}): CanvasTexture {
  const generator = new ASCIITextureGenerator(options)
  return generator.generateTexture()
}
