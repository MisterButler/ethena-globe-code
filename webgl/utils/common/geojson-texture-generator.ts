/**
 * GeoJSON to Texture Generator
 * Converts GeoJSON coastline data to a black and white texture for sphere mapping
 */

interface GeoJSONFeature {
  type: string
  properties: any
  geometry: {
    type: string
    coordinates: number[][] | number[][][] | number[][][][] | number[][][][][]
  }
}

interface GeoJSONFeatureCollection {
  type: string
  features: GeoJSONFeature[]
}

export interface GeoJSONTextureOptions {
  width: number
  height: number
  backgroundColor: string
  coastlineColor: string
  fillColor: string
  lineWidth: number
  antialias: boolean
  fillPolygons: boolean
  showOutlines: boolean
}

export class GeoJSONTextureGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private options: GeoJSONTextureOptions

  constructor(options: Partial<GeoJSONTextureOptions> = {}) {
    this.options = {
      width: 2048,
      height: 1024,
      backgroundColor: 'transparent',
      coastlineColor: '#ffffff',
      fillColor: '#ffffff',
      lineWidth: 1,
      antialias: true,
      fillPolygons: true,
      showOutlines: false,
      ...options,
    }

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.options.width
    this.canvas.height = this.options.height

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas')
    }
    this.ctx = ctx

    // Setup canvas for high quality rendering
    if (this.options.antialias) {
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    }
  }

  /**
   * Convert longitude/latitude to texture coordinates (0-1)
   */
  private lonLatToTexCoords(lon: number, lat: number): [number, number] {
    // Convert longitude from -180 to 180 to 0 to 1
    const u = (lon + 180) / 360

    // Convert latitude from -90 to 90 to 0 to 1 (inverted for texture coordinates)
    const v = 1 - (lat + 90) / 180

    return [u, v]
  }

  /**
   * Convert texture coordinates to canvas pixel coordinates
   */
  private texCoordsToPixels(u: number, v: number): [number, number] {
    const x = u * this.options.width
    const y = v * this.options.height
    return [x, y]
  }

  /**
   * Draw a LineString geometry on the canvas (outline only)
   */
  private drawLineString(coordinates: number[][]): void {
    if (coordinates.length < 2) return

    this.ctx.beginPath()

    for (let i = 0; i < coordinates.length; i++) {
      const [lon, lat] = coordinates[i]
      const [u, v] = this.lonLatToTexCoords(lon, lat)
      const [x, y] = this.texCoordsToPixels(u, v)

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }

    if (this.options.showOutlines) {
      this.ctx.stroke()
    }
  }

  /**
   * Draw a filled polygon on the canvas
   */
  private drawPolygon(coordinates: number[][][], fill: boolean = false): void {
    if (coordinates.length === 0) return

    // Draw the outer ring
    const outerRing = coordinates[0]
    if (outerRing.length < 3) return

    this.ctx.beginPath()

    for (let i = 0; i < outerRing.length; i++) {
      const [lon, lat] = outerRing[i]
      const [u, v] = this.lonLatToTexCoords(lon, lat)
      const [x, y] = this.texCoordsToPixels(u, v)

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }

    this.ctx.closePath()

    // Handle holes (inner rings)
    for (let i = 1; i < coordinates.length; i++) {
      const hole = coordinates[i]
      if (hole.length < 3) continue

      for (let j = 0; j < hole.length; j++) {
        const [lon, lat] = hole[j]
        const [u, v] = this.lonLatToTexCoords(lon, lat)
        const [x, y] = this.texCoordsToPixels(u, v)

        if (j === 0) {
          this.ctx.moveTo(x, y)
        } else {
          this.ctx.lineTo(x, y)
        }
      }
      this.ctx.closePath()
    }

    // Fill and/or stroke based on options
    if (fill && this.options.fillPolygons) {
      this.ctx.fillStyle = this.options.fillColor
      this.ctx.fill('evenodd') // Use even-odd rule for holes
    }

    if (this.options.showOutlines) {
      this.ctx.stroke()
    }
  }

  /**
   * Draw a MultiLineString geometry on the canvas
   */
  private drawMultiLineString(coordinates: number[][][]): void {
    for (const lineString of coordinates) {
      this.drawLineString(lineString)
    }
  }

  /**
   * Generate texture from GeoJSON data
   */
  generateTexture(geojsonData: GeoJSONFeatureCollection): HTMLCanvasElement {
    // Clear canvas - if transparent, clear to transparent, otherwise use background color
    if (this.options.backgroundColor === 'transparent') {
      this.ctx.clearRect(0, 0, this.options.width, this.options.height)
    } else {
      this.ctx.fillStyle = this.options.backgroundColor
      this.ctx.fillRect(0, 0, this.options.width, this.options.height)
    }

    // Setup drawing style
    this.ctx.strokeStyle = this.options.coastlineColor
    this.ctx.lineWidth = this.options.lineWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    // Draw all features
    for (const feature of geojsonData.features) {
      const { geometry } = feature

      switch (geometry.type) {
        case 'LineString':
          this.drawLineString(geometry.coordinates as number[][])
          break

        case 'MultiLineString':
          this.drawMultiLineString(geometry.coordinates as number[][][])
          break

        case 'Polygon': {
          // Draw the polygon with optional fill
          const polygon = geometry.coordinates as number[][][]
          this.drawPolygon(polygon, true)
          break
        }

        case 'MultiPolygon': {
          // Draw all polygons with optional fill
          const multiPolygon = geometry.coordinates as number[][][][]
          for (const polygon of multiPolygon) {
            this.drawPolygon(polygon, true)
          }
          break
        }
      }
    }

    return this.canvas
  }

  /**
   * Generate texture and return as data URL for download
   */
  generateDataURL(geojsonData: GeoJSONFeatureCollection, format: 'image/png' | 'image/jpeg' = 'image/png'): string {
    this.generateTexture(geojsonData)
    return this.canvas.toDataURL(format)
  }

  /**
   * Download the generated texture as an image file
   */
  downloadTexture(geojsonData: GeoJSONFeatureCollection, filename: string = 'coastline-texture.png'): void {
    const dataURL = this.generateDataURL(geojsonData)

    const link = document.createElement('a')
    link.download = filename
    link.href = dataURL
    link.click()
  }

  /**
   * Update generator options
   */
  updateOptions(newOptions: Partial<GeoJSONTextureOptions>): void {
    this.options = { ...this.options, ...newOptions }

    // Update canvas size if changed
    if (newOptions.width || newOptions.height) {
      this.canvas.width = this.options.width
      this.canvas.height = this.options.height
    }
  }

  /**
   * Get the canvas element for direct manipulation
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  /**
   * Get current options
   */
  getOptions(): GeoJSONTextureOptions {
    return { ...this.options }
  }

  /**
   * Load GeoJSON from URL
   */
  static async loadGeoJSON(url: string): Promise<GeoJSONFeatureCollection> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Create a texture with multiple coastline detail levels
   */
  generateMultiDetailTexture(
    coastlineData: GeoJSONFeatureCollection,
    detailLevels: {
      data: GeoJSONFeatureCollection
      lineWidth: number
      opacity: number
    }[],
  ): HTMLCanvasElement {
    // Clear canvas - if transparent, clear to transparent, otherwise use background color
    if (this.options.backgroundColor === 'transparent') {
      this.ctx.clearRect(0, 0, this.options.width, this.options.height)
    } else {
      this.ctx.fillStyle = this.options.backgroundColor
      this.ctx.fillRect(0, 0, this.options.width, this.options.height)
    }

    // Draw each detail level
    for (const level of detailLevels) {
      this.ctx.globalAlpha = level.opacity
      this.ctx.lineWidth = level.lineWidth
      this.ctx.strokeStyle = this.options.coastlineColor

      for (const feature of level.data.features) {
        const { geometry } = feature

        switch (geometry.type) {
          case 'LineString':
            this.drawLineString(geometry.coordinates as number[][])
            break

          case 'MultiLineString':
            this.drawMultiLineString(geometry.coordinates as number[][][])
            break
        }
      }
    }

    // Reset alpha
    this.ctx.globalAlpha = 1.0

    return this.canvas
  }

  dispose(): void {
    // Canvas cleanup is handled by garbage collection
  }
}

export default GeoJSONTextureGenerator
