import { saveAs } from 'file-saver'
import { Color, EventDispatcher, MathUtils } from 'three'

import { saveJsonFile } from '@/webgl/utils/common/basic-functions'
import createCanvas from '@/webgl/utils/common/canvas'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'

import lines from './lines.json'
import squares from './squares.json'

class Line {
  constructor(
    public x = 0,
    public y = 0,
    public length = 100,
    public phase = Math.random(),
  ) {}
}

class Square {
  constructor(
    public x = 0,
    public y = 0,
    public animated = true,
    public phase = Math.random(),
  ) {}
}

export interface BackgroundToolEvent {
  linesUpdate: {}
  squaresUpdate: {}
}

export default class BackgroundTool extends EventDispatcher<BackgroundToolEvent> {
  ctx?: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  lines: Line[] = []
  squares: Square[] = []
  hoveredCell: { col: number; row: number } | null = null

  settings = {
    ascii: true,
    background: true,
    backgroundColor: '#000000',
    brightnessColor: '#324876',
    characters: './$ENA',
    dpi: 2,
    fontSize: 9,
    grid: false,
    levels: false,
    lines: true,
    reference: false,
    size: 9,
    squareEditMode: false,
  }

  constructor(root: HTMLElement) {
    super()
    this.image = new Image()
    this.image.onload = this.onLoaded
    this.image.src = '/webgl/background.png'
    const { canvas, ctx } = createCanvas(1, 1)

    if (ctx) {
      this.ctx = ctx
    }

    this.canvas = canvas

    root.appendChild(this.canvas)

    Object.assign(canvas.style, {
      left: '0',
      position: 'absolute',
      top: '0',
    })

    lines.forEach(line => {
      this.lines.push(new Line(line.x, line.y, line.length))
    })

    squares.forEach(square => {
      this.squares.push(new Square(square.x, square.y, square.animated))
    })

    this.canvas.addEventListener('mousedown', this.onMouseDown)
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('mouseleave', this.onMouseLeave)
  }

  onMouseDown = (event: MouseEvent) => {
    if (!this.settings.squareEditMode) return

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const cellSize = this.settings.size
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)

    // Check if there's already a square in this cell
    const existingSquareIndex = this.squares.findIndex(square => {
      const squareCol = Math.round((square.x * this.canvas.width) / (cellSize * this.settings.dpi))

      const squareRow = Math.round((square.y * this.canvas.height) / (cellSize * this.settings.dpi))

      return squareCol === col && squareRow === row
    })

    if (existingSquareIndex >= 0) {
      // Remove existing square
      this.squares.splice(existingSquareIndex, 1)
    } else {
      // Add new square
      const normalizedX = (col * cellSize * this.settings.dpi) / this.canvas.width

      const normalizedY = (row * cellSize * this.settings.dpi) / this.canvas.height

      this.squares.push(new Square(normalizedX, normalizedY, true))
    }

    this.dispatchEvent({ type: 'squaresUpdate' })
    this.draw()
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.settings.squareEditMode) return

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const cellSize = this.settings.size
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)

    const cols = Math.ceil(this.canvas.width / this.settings.dpi / cellSize)
    const rows = Math.ceil(this.canvas.height / this.settings.dpi / cellSize)

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      this.hoveredCell = { col, row }
    } else {
      this.hoveredCell = null
    }

    this.draw()
  }

  onMouseLeave = () => {
    if (!this.settings.squareEditMode) return
    this.hoveredCell = null
    this.draw()
  }

  onLoaded = () => {
    this.canvas.width = this.image.width
    this.canvas.height = this.image.height

    this.resize()
    this.draw()
  }

  resize() {
    const width = this.image.width
    const height = this.image.height
    this.canvas.width = width * this.settings.dpi
    this.canvas.height = height * this.settings.dpi
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
      this.ctx.scale(this.settings.dpi, this.settings.dpi) // Apply DPI scaling
    }
  }

  draw = () => {
    if (!this.ctx) return

    const canvasWidth = this.canvas.width / this.settings.dpi
    const canvasHeight = this.canvas.height / this.settings.dpi

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    this.ctx.drawImage(this.image, 0, 0, canvasWidth, canvasHeight)

    const cellSize = this.settings.size
    const cols = Math.ceil(canvasWidth / cellSize)
    const rows = Math.ceil(canvasHeight / cellSize)

    // --- Step 1: Gather brightness for all cells ---
    const brightnessGrid: number[][] = []
    let globalMin = Infinity
    let globalMax = -Infinity

    for (let row = 0; row < rows; row++) {
      brightnessGrid[row] = []

      for (let col = 0; col < cols; col++) {
        let brightnessSum = 0
        let pixelCount = 0

        const xStart = col * cellSize
        const yStart = row * cellSize
        const w = Math.min(cellSize, canvasWidth - xStart)
        const h = Math.min(cellSize, canvasHeight - yStart)

        const imageData = this.ctx.getImageData(
          xStart * this.settings.dpi,
          yStart * this.settings.dpi,
          w * this.settings.dpi,
          h * this.settings.dpi,
        )

        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b
          brightnessSum += brightness
          pixelCount++
        }

        const avgBrightness = pixelCount ? brightnessSum / (pixelCount * 255) : 0

        brightnessGrid[row][col] = avgBrightness
        globalMin = Math.min(globalMin, avgBrightness)
        globalMax = Math.max(globalMax, avgBrightness)
      }
    }

    if (!this.settings.reference) {
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      if (this.settings.background) {
        this.ctx.fillStyle = this.settings.backgroundColor
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      }
    }

    // --- Step 2: Normalize + quantize into 5 levels ---
    const levels = 5
    const color = new Color()
    const colorMin = new Color(this.settings.backgroundColor)
    const colorMax = new Color(this.settings.brightnessColor)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const norm = (brightnessGrid[row][col] - globalMin) / (globalMax - globalMin || 1) // avoid div by 0

        // Quantize into 5 steps → 0..4
        const level = Math.floor(norm * (levels - 1))

        // --- Step 3: Draw (for now grayscale) ---
        const gray = Math.floor((level / (levels - 1)) * 255)
        const xStart = col * cellSize
        const yStart = row * cellSize
        const w = Math.min(cellSize, canvasWidth - xStart)
        const h = Math.min(cellSize, canvasHeight - yStart)

        if (this.settings.levels) {
          this.ctx.fillStyle = `rgb(${gray},${gray},${gray})`
          this.ctx.fillRect(xStart, yStart, w, h)
        }

        // --- Step 3: Draw ASCII ---
        const chars = this.settings.characters
        const char = chars[level] || chars[chars.length - 1]

        // Draw ASCII character
        if (this.settings.ascii) {
          this.ctx.fillStyle = `#${color.lerpColors(colorMin, colorMax, norm).getHexString()}`
          this.ctx.font = `${this.settings.fontSize}px monospace`
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText(char, xStart + w / 2, yStart + h / 2)
        }
      }
    }

    if (this.settings.grid) {
      // Draw white grid lines overlay
      this.ctx.save()
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      this.ctx.lineWidth = 0.1

      // Vertical lines
      for (let col = 0; col <= cols; col++) {
        const x = col * cellSize
        this.ctx.beginPath()
        this.ctx.moveTo(x, 0)
        this.ctx.lineTo(x, this.canvas.height)
        this.ctx.stroke()
      }

      // Horizontal lines
      for (let row = 0; row <= rows; row++) {
        const y = row * cellSize
        this.ctx.beginPath()
        this.ctx.moveTo(0, y)
        this.ctx.lineTo(this.canvas.width, y)
        this.ctx.stroke()
      }

      this.ctx.restore()
    }

    // Draw gradient lines
    this.lines.forEach(line => {
      // Snap start position to closest cell center (X and Y)
      const cellSizePx = cellSize * this.settings.dpi
      const canvasWidthPx = this.canvas.width
      const canvasHeightPx = this.canvas.height
      // Find closest column
      const rawX = line.x * canvasWidthPx
      const colIdx = Math.round(rawX / cellSizePx)
      const snappedX = colIdx * cellSizePx + cellSizePx / 2
      // Snap Y to closest row center, but if y==0, snap to top edge
      const startYNorm = line.y * canvasHeightPx
      let snappedY

      if (line.y === 0) {
        snappedY = 0
      } else {
        const rowIdx = Math.round(startYNorm / cellSizePx)
        snappedY = rowIdx * cellSizePx + cellSizePx / 2
      }

      // Calculate end position at 45 degrees clockwise
      const angle = MathUtils.degToRad(135) // 45 degrees in radians
      const endX = snappedX + line.length * Math.cos(angle)
      const endY = snappedY + line.length * Math.sin(angle)

      if (this.ctx) {
        if (this.settings.lines) {
          this.ctx.save()

          // Optional: set gradient stroke style
          const grad = this.ctx.createLinearGradient(snappedX, snappedY, endX, endY)

          const green = Math.floor(line.phase * 255)
          grad.addColorStop(0, `rgba(255, ${green}, 0, 1)`)
          grad.addColorStop(1, `rgba(0, ${green}, 0, 1)`)
          this.ctx.strokeStyle = grad
          this.ctx.lineWidth = 6
          this.ctx.beginPath()
          this.ctx.moveTo(snappedX, snappedY)
          this.ctx.lineTo(endX, endY)
          this.ctx.stroke()
          this.ctx.restore()
        }
      }
    })

    // Draw squares
    this.squares.forEach(square => {
      // Snap square position to closest cell center (X and Y)
      const cellSizePx = cellSize * this.settings.dpi
      const canvasWidthPx = this.canvas.width
      const canvasHeightPx = this.canvas.height
      const totalCols = Math.ceil(canvasWidthPx / cellSizePx)
      const totalRows = Math.ceil(canvasHeightPx / cellSizePx)

      // Find closest column and row for square
      const rawX = square.x * canvasWidthPx
      const colIdx = Math.round(rawX / cellSizePx)
      const snappedX = colIdx * cellSize

      const rawY = square.y * canvasHeightPx
      const rowIdx = Math.round(rawY / cellSizePx)
      const snappedY = rowIdx * cellSize

      if (this.ctx && colIdx >= 0 && colIdx < totalCols && rowIdx >= 0 && rowIdx < totalRows) {
        this.ctx.save()

        const phase = Math.floor(square.phase * 255)
        this.ctx.fillStyle = `rgba(0, ${phase}, ${square.animated ? 255 : 0}, 1)`
        this.ctx.fillRect(snappedX, snappedY, cellSize, cellSize)
        this.ctx.restore()
      }
    })

    // Draw hover preview for square edit mode
    if (this.settings.squareEditMode && this.hoveredCell && this.ctx) {
      this.ctx.save()
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([5, 5])

      this.ctx.strokeRect(this.hoveredCell.col * cellSize, this.hoveredCell.row * cellSize, cellSize, cellSize)

      this.ctx.restore()
    }
  }

  save = () => {
    const width = this.canvas.width / 2
    const height = this.canvas.height / 2

    const { canvas, ctx } = createCanvas(width, height)

    if (!ctx) return
    ctx.drawImage(this.canvas, 0, 0, width, height)

    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        saveAs(blob, 'ascii-data.png')
      }
    }, 'png')
  }

  addLine = () => {
    this.lines.push(new Line(0.5, 0.1, 100))
    this.dispatchEvent({ type: 'linesUpdate' })
    this.draw()
  }

  addSquare = () => {
    this.squares.push(new Square(0.5, 0.5, true))
    this.dispatchEvent({ type: 'squaresUpdate' })
    this.draw()
  }

  saveLinesData = () => {
    const data: any = []

    this.lines.forEach(line => {
      data.push({ length: line.length, x: line.x, y: line.y })
    })

    saveJsonFile(JSON.stringify(data, null, 2), 'lines.json')
  }

  saveSquaresData = () => {
    const data: any = []

    this.squares.forEach(square => {
      data.push({
        animated: square.animated,
        phase: square.phase,
        x: square.x,
        y: square.y,
      })
    })

    saveJsonFile(JSON.stringify(data, null, 2), 'squares.json')
  }
}

export class GUIBackgroundTool extends GUIController {
  constructor(
    gui: GUIType,
    public target: BackgroundTool,
  ) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'BackgroundTool' })

    this.gui.addBinding(target.settings, 'background').on('change', target.draw)

    this.gui.addBinding(target.settings, 'grid').on('change', target.draw)
    this.gui.addBinding(target.settings, 'reference').on('change', target.draw)
    this.gui.addBinding(target.settings, 'levels').on('change', target.draw)
    this.gui.addBinding(target.settings, 'ascii').on('change', target.draw)
    this.gui.addBinding(target.settings, 'lines').on('change', target.draw)

    this.gui.addBinding(target.settings, 'squareEditMode').on('change', target.draw)

    this.gui.addBinding(target.settings, 'characters', { readonly: true })

    this.gui.addBinding(target.settings, 'fontSize', { max: 10, min: 5 }).on('change', target.draw)

    this.gui.addBinding(target.settings, 'backgroundColor').on('change', target.draw)

    this.gui.addBinding(target.settings, 'brightnessColor').on('change', target.draw)

    this.gui.addButton({ title: 'Save' }).on('click', target.save)

    this.onLinesUpdate()
    this.onSquaresUpdate()

    target.addEventListener('linesUpdate', this.onLinesUpdate)
    target.addEventListener('squaresUpdate', this.onSquaresUpdate)
  }

  onLinesUpdate = () => {
    if (this.folders.lines) {
      this.folders.lines.dispose()
    }

    this.folders.lines = this.addFolder(this.gui, { title: 'Lines' })

    this.folders.lines.addButton({ title: 'Save' }).on('click', this.target.saveLinesData)

    this.folders.lines.addButton({ title: 'Add line' }).on('click', this.target.addLine)

    this.target.lines.forEach((line, i) => {
      const folder = this.addFolder(this.folders.lines, {
        title: `line-${i}`,
      })

      this.folders[`line-${i}`] = folder

      folder.addBinding(line, 'x', { max: 1, min: 0 }).on('change', this.target.draw)

      folder.addBinding(line, 'y', { max: 1, min: 0 }).on('change', this.target.draw)

      folder.addBinding(line, 'length', { min: 0 }).on('change', this.target.draw)

      folder.addButton({ title: 'Move left' }).on('click', () => {
        // Move to previous cell
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.width

        // Find current cell index
        const currentIdx = Math.round(line.x / cellSizeNorm)
        const prevIdx = Math.max(currentIdx - 1, 0)
        line.x = prevIdx * cellSizeNorm
        this.target.draw()
      })

      folder.addButton({ title: 'Move right' }).on('click', () => {
        // Move to next cell
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.width

        const totalCols = Math.ceil(this.target.canvas.width / (this.target.settings.size * this.target.settings.dpi))

        const currentIdx = Math.round(line.x / cellSizeNorm)
        const nextIdx = Math.min(currentIdx + 1, totalCols - 1)
        line.x = nextIdx * cellSizeNorm
        this.target.draw()
      })

      folder.addButton({ title: 'Move up' }).on('click', () => {
        // Move to previous row
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.height

        const currentIdx = Math.round(line.y / cellSizeNorm)
        const prevIdx = Math.max(currentIdx - 1, 0)
        line.y = prevIdx * cellSizeNorm
        this.target.draw()
      })

      folder.addButton({ title: 'Move down' }).on('click', () => {
        // Move to next row
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.height

        const totalRows = Math.ceil(this.target.canvas.height / (this.target.settings.size * this.target.settings.dpi))

        const currentIdx = Math.round(line.y / cellSizeNorm)
        const nextIdx = Math.min(currentIdx + 1, totalRows - 1)
        line.y = nextIdx * cellSizeNorm
        this.target.draw()
      })
    })
  }

  onSquaresUpdate = () => {
    if (this.folders.squares) {
      this.folders.squares.dispose()
    }

    this.folders.squares = this.addFolder(this.gui, { title: 'Squares' })

    this.folders.squares.addButton({ title: 'Save' }).on('click', this.target.saveSquaresData)

    this.folders.squares.addButton({ title: 'Add square' }).on('click', this.target.addSquare)

    this.target.squares.forEach((square, i) => {
      const folder = this.addFolder(this.folders.squares, {
        title: `square-${i}`,
      })

      this.folders[`square-${i}`] = folder

      folder.addBinding(square, 'x', { max: 1, min: 0 }).on('change', this.target.draw)

      folder.addBinding(square, 'y', { max: 1, min: 0 }).on('change', this.target.draw)

      folder.addBinding(square, 'animated').on('change', this.target.draw)

      folder.addBinding(square, 'phase', { max: 1, min: 0 }).on('change', this.target.draw)

      folder.addButton({ title: 'Move left' }).on('click', () => {
        // Move to previous cell
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.width

        // Find current cell index
        const currentIdx = Math.round(square.x / cellSizeNorm)
        const prevIdx = Math.max(currentIdx - 1, 0)
        square.x = prevIdx * cellSizeNorm
        this.target.draw()
      })

      folder.addButton({ title: 'Move right' }).on('click', () => {
        // Move to next cell
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.width

        const totalCols = Math.ceil(this.target.canvas.width / (this.target.settings.size * this.target.settings.dpi))

        const currentIdx = Math.round(square.x / cellSizeNorm)
        const nextIdx = Math.min(currentIdx + 1, totalCols - 1)
        square.x = nextIdx * cellSizeNorm
        this.target.draw()
      })

      folder.addButton({ title: 'Move up' }).on('click', () => {
        // Move to previous row
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.height

        const currentIdx = Math.round(square.y / cellSizeNorm)
        const prevIdx = Math.max(currentIdx - 1, 0)
        square.y = prevIdx * cellSizeNorm
        this.target.draw()
      })

      folder.addButton({ title: 'Move down' }).on('click', () => {
        // Move to next row
        const cellSizeNorm = (this.target.settings.size * this.target.settings.dpi) / this.target.canvas.height

        const totalRows = Math.ceil(this.target.canvas.height / (this.target.settings.size * this.target.settings.dpi))

        const currentIdx = Math.round(square.y / cellSizeNorm)
        const nextIdx = Math.min(currentIdx + 1, totalRows - 1)
        square.y = nextIdx * cellSizeNorm
        this.target.draw()
      })
    })
  }
}
