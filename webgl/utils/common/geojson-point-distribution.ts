/**
 * GeoJSON Point Distribution Generator
 * Generates uniformly distributed circles across country surfaces from GeoJSON data
 * Uses an offset grid pattern for clean and uniform circle placement
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

export interface DistributedPoint {
  lon: number
  lat: number
  radius: number // Circle radius in degrees
  countryName?: string
  featureIndex: number
}

export interface PointDistributionOptions {
  circleRadius: number // Circle radius in degrees
  gridSpacing: number // Spacing between grid points in degrees
  onlyLandmasses: boolean // Only generate points on filled polygons
  minFeatureArea: number // Minimum feature area threshold (in square degrees)
  seed?: number // Random seed for reproducible results
  jitterAmount: number // Amount of random jitter to apply to grid points (0-1)
  useHexagonalGrid: boolean // Use hexagonal offset pattern vs regular grid
}

export class GeoJSONPointDistribution {
  private options: PointDistributionOptions
  private rng: () => number

  constructor(options: Partial<PointDistributionOptions> = {}) {
    this.options = {
      circleRadius: 1.0, // degrees (roughly 100km at equator)
      gridSpacing: 2.5, // degrees (spacing between grid points)
      onlyLandmasses: true,
      minFeatureArea: 1.0, // square degrees (excludes very small islands)
      jitterAmount: 0.3, // 30% jitter
      useHexagonalGrid: true, // Use hexagonal offset pattern
      seed: Math.random(),
      ...options,
    }

    // Create seeded random number generator
    this.rng = this.createSeededRNG(this.options.seed || Math.random())
  }

  /**
   * Create a seeded random number generator using a simple LCG
   */
  private createSeededRNG(seed: number): () => number {
    let state = seed
    return () => {
      state = (state * 1664525 + 1013904223) % 2 ** 32
      return state / 2 ** 32
    }
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  private isPointInPolygon(lon: number, lat: number, polygon: number[][]): boolean {
    let inside = false
    const x = lon
    const y = lat

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0]
      const yi = polygon[i][1]
      const xj = polygon[j][0]
      const yj = polygon[j][1]

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }

    return inside
  }

  /**
   * Check if a point is inside any of the polygon's rings (accounting for holes)
   */
  private isPointInPolygonWithHoles(lon: number, lat: number, coordinates: number[][][]): boolean {
    if (coordinates.length === 0) return false

    // Check if point is in outer ring
    const inOuter = this.isPointInPolygon(lon, lat, coordinates[0])
    if (!inOuter) return false

    // Check if point is in any hole (inner rings)
    for (let i = 1; i < coordinates.length; i++) {
      if (this.isPointInPolygon(lon, lat, coordinates[i])) {
        return false // Point is in a hole
      }
    }

    return true
  }

  /**
   * Check if a point is inside any feature geometry
   */
  private isPointInFeature(lon: number, lat: number, feature: GeoJSONFeature): boolean {
    const { geometry } = feature

    switch (geometry.type) {
      case 'Polygon':
        return this.isPointInPolygonWithHoles(lon, lat, geometry.coordinates as number[][][])

      case 'MultiPolygon':
        const multiPolygonCoords = geometry.coordinates as number[][][][]
        return multiPolygonCoords.some(polygon => this.isPointInPolygonWithHoles(lon, lat, polygon))

      default:
        return false // We only distribute points in polygons
    }
  }

  /**
   * Calculate distance between two points in degrees
   */
  private distanceBetweenPoints(lon1: number, lat1: number, lon2: number, lat2: number): number {
    const dLon = lon2 - lon1
    const dLat = lat2 - lat1
    return Math.sqrt(dLon * dLon + dLat * dLat)
  }

  /**
   * Check if two circles overlap
   */
  private circlesOverlap(
    lon1: number,
    lat1: number,
    radius1: number,
    lon2: number,
    lat2: number,
    radius2: number,
  ): boolean {
    const distance = this.distanceBetweenPoints(lon1, lat1, lon2, lat2)
    return distance < radius1 + radius2
  }

  /**
   * Generate a hexagonal offset grid of circles across the globe
   */
  private generateGlobalGrid(): { lon: number; lat: number }[] {
    const points: { lon: number; lat: number }[] = []
    const { gridSpacing, jitterAmount, useHexagonalGrid } = this.options

    let rowIndex = 0

    // Generate points in a grid with optional hexagonal offset
    for (let lat = -90 + gridSpacing / 2; lat < 90; lat += gridSpacing) {
      // Adjust longitude spacing based on latitude to maintain roughly equal spacing
      const latCorrection = Math.cos((lat * Math.PI) / 180)
      const adjustedLonSpacing = gridSpacing / Math.max(latCorrection, 0.1)

      // Calculate offset for hexagonal pattern
      const hexOffset = useHexagonalGrid && rowIndex % 2 === 1 ? adjustedLonSpacing / 2 : 0

      for (let lon = -180 + hexOffset; lon < 180; lon += adjustedLonSpacing) {
        // Add some random jitter to make it look more natural
        const jitterLon = (this.rng() - 0.5) * gridSpacing * jitterAmount
        const jitterLat = (this.rng() - 0.5) * gridSpacing * jitterAmount

        const finalLon = lon + jitterLon
        const finalLat = Math.max(-90, Math.min(90, lat + jitterLat))

        // Safety check for valid coordinates
        if (isFinite(finalLon) && isFinite(finalLat)) {
          points.push({ lon: finalLon, lat: finalLat })
        }
      }

      rowIndex++
    }

    return points
  }

  /**
   * Get bounding box for a feature
   */
  private getFeatureBounds(feature: GeoJSONFeature): {
    minLon: number
    maxLon: number
    minLat: number
    maxLat: number
  } {
    let minLon = Infinity
    let maxLon = -Infinity
    let minLat = Infinity
    let maxLat = -Infinity

    const processCoordinate = (coord: number[]) => {
      const [lon, lat] = coord
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }

    const processCoordinates = (coords: any) => {
      if (Array.isArray(coords[0])) {
        coords.forEach(processCoordinates)
      } else {
        processCoordinate(coords)
      }
    }

    processCoordinates(feature.geometry.coordinates)

    return { minLon, maxLon, minLat, maxLat }
  }

  /**
   * Calculate more precise polygon area using shoelace formula
   * (for better filtering of small features)
   */

  /**
   * Calculate feature area (approximate, for point distribution weighting)
   * Uses spherical approximation for better area estimation
   */
  private calculateFeatureArea(feature: GeoJSONFeature): number {
    const bounds = this.getFeatureBounds(feature)
    const width = bounds.maxLon - bounds.minLon
    const height = bounds.maxLat - bounds.minLat

    // Apply spherical correction for latitude distortion
    const avgLat = (bounds.minLat + bounds.maxLat) / 2
    const latCorrection = Math.cos((avgLat * Math.PI) / 180)

    return width * height * latCorrection
  }

  /**
   * Calculate more precise polygon area using shoelace formula
   * (for better filtering of small features)
   */
  private calculatePolygonArea(coordinates: number[][]): number {
    if (coordinates.length < 3) return 0

    let area = 0
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length
      area += coordinates[i][0] * coordinates[j][1]
      area -= coordinates[j][0] * coordinates[i][1]
    }
    return Math.abs(area) / 2
  }

  /**
   * Get precise area for a feature (for filtering purposes)
   */
  private getPreciseFeatureArea(feature: GeoJSONFeature): number {
    const { geometry } = feature
    let totalArea = 0

    switch (geometry.type) {
      case 'Polygon':
        const polygonCoords = geometry.coordinates as number[][][]
        if (polygonCoords.length > 0) {
          // Main polygon area
          totalArea += this.calculatePolygonArea(polygonCoords[0])
          // Subtract holes
          for (let i = 1; i < polygonCoords.length; i++) {
            totalArea -= this.calculatePolygonArea(polygonCoords[i])
          }
        }
        break

      case 'MultiPolygon':
        const multiPolygonCoords = geometry.coordinates as number[][][][]
        for (const polygon of multiPolygonCoords) {
          if (polygon.length > 0) {
            // Main polygon area
            totalArea += this.calculatePolygonArea(polygon[0])
            // Subtract holes
            for (let i = 1; i < polygon.length; i++) {
              totalArea -= this.calculatePolygonArea(polygon[i])
            }
          }
        }
        break

      default:
        return 0
    }

    return Math.abs(totalArea)
  }

  /**
   * Distribute circles across all features in the GeoJSON data using grid approach
   */
  distributePoints(geojsonData: GeoJSONFeatureCollection): DistributedPoint[] {
    const validPoints: DistributedPoint[] = []

    // Filter features to only include polygons if onlyLandmasses is true
    let validFeatures = geojsonData.features.filter(feature => {
      if (!this.options.onlyLandmasses) return true
      return feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'
    })

    // Filter out features that are too small
    const featuresWithAreas = validFeatures.map(feature => ({
      feature,
      area: this.getPreciseFeatureArea(feature),
    }))

    const filteredFeatures = featuresWithAreas.filter(({ area }) => area >= this.options.minFeatureArea)

    if (filteredFeatures.length === 0) {
      console.warn('No features found above minimum area threshold')
      return validPoints
    }

    console.log(`Processing ${filteredFeatures.length} features above ${this.options.minFeatureArea}° threshold`)

    // Generate global grid of potential circle positions
    const gridPoints = this.generateGlobalGrid()
    console.log(`Generated ${gridPoints.length} grid points`)

    // Check each grid point against all features
    gridPoints.forEach(gridPoint => {
      for (let i = 0; i < filteredFeatures.length; i++) {
        const { feature } = filteredFeatures[i]

        // Check if the circle center is inside this feature
        if (this.isPointInFeature(gridPoint.lon, gridPoint.lat, feature)) {
          const countryName = feature.properties?.NAME || feature.properties?.name || `Feature ${i}`

          // Safety check for valid coordinates and radius
          if (isFinite(gridPoint.lon) && isFinite(gridPoint.lat) && isFinite(this.options.circleRadius)) {
            validPoints.push({
              lon: gridPoint.lon,
              lat: gridPoint.lat,
              radius: this.options.circleRadius,
              countryName,
              featureIndex: i,
            })
          }

          // Break after finding the first matching feature to avoid duplicates
          break
        }
      }
    })

    console.log(`Generated ${validPoints.length} circles across ${filteredFeatures.length} features`)
    return validPoints
  }

  /**
   * Export points as JSON
   */
  exportPointsAsJSON(points: DistributedPoint[]): string {
    return JSON.stringify(
      {
        metadata: {
          pointCount: points.length,
          circleRadius: this.options.circleRadius,
          gridSpacing: this.options.gridSpacing,
          generatedAt: new Date().toISOString(),
          seed: this.options.seed,
        },
        points: points,
      },
      null,
      2,
    )
  }

  /**
   * Load GeoJSON data from URL
   */
  static async loadGeoJSON(url: string): Promise<GeoJSONFeatureCollection> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error loading GeoJSON:', error)
      throw error
    }
  }

  /**
   * Get current options
   */
  getOptions(): PointDistributionOptions {
    return { ...this.options }
  }

  /**
   * Update options
   */
  updateOptions(newOptions: Partial<PointDistributionOptions>): void {
    this.options = { ...this.options, ...newOptions }

    // Update RNG if seed changed
    if (newOptions.seed !== undefined) {
      this.rng = this.createSeededRNG(newOptions.seed)
    }
  }
}

export default GeoJSONPointDistribution
