/**
 * Example of how to work with coastline data vs country polygon data
 * using the three-geojson library
 */

import { WGS84_ELLIPSOID } from '3d-tiles-renderer'
import { LineBasicMaterial } from 'three'

// Helper function to identify what type of GeoJSON data you have
export function identifyGeoJSONDataType(data: any): string {
  const summary = {
    features: data.features?.length || 0,
    polygons: data.polygons?.length || 0,
    lines: data.lines?.length || 0,
    points: data.points?.length || 0,
  }

  console.log('GeoJSON Data Summary:', summary)

  if (summary.lines > 0 && summary.polygons === 0) {
    return 'coastline' // Pure line data (like ne_50m_coastline.geojson)
  } else if (summary.polygons > 0 && summary.lines === 0) {
    return 'country_polygons' // Pure polygon data (like world.geojson)
  } else if (summary.polygons > 0 && summary.lines > 0) {
    return 'mixed' // Mixed data
  } else if (summary.points > 0) {
    return 'points' // Point data
  } else {
    return 'unknown'
  }
}

// Example function showing how to process different GeoJSON data types
export function processGeoJSONData(data: any) {
  console.log('GeoJSON data structure:', data)
  const dataType = identifyGeoJSONDataType(data)
  console.log('Detected data type:', dataType)

  // Check what type of data we have
  if (data.lines && data.lines.length > 0) {
    console.log(`Found ${data.lines.length} line features (coastlines, borders, etc.)`)

    // Process each line feature
    data.lines.forEach((lineGeom: any, index: number) => {
      const feature = lineGeom.feature

      console.log(`Line ${index}:`, {
        type: lineGeom.type,
        properties: feature?.properties,
        dataLength: lineGeom.data?.length,
      })

      // Create Three.js line geometry from the coastline data
      const line = lineGeom.getLineObject({
        ellipsoid: WGS84_ELLIPSOID,
        resolution: 2.5,
        offset: 200,
      })

      // Apply material to the line
      line.material = new LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      })

      // Add to scene or group
      // scene.add(line);
    })
  }

  if (data.polygons && data.polygons.length > 0) {
    console.log(`Found ${data.polygons.length} polygon features (countries, regions, etc.)`)

    // Process each polygon feature
    data.polygons.forEach((polyGeom: any, index: number) => {
      const feature = polyGeom.feature

      console.log(`Polygon ${index}:`, {
        type: polyGeom.type,
        countryName: feature?.properties?.name,
        properties: feature?.properties,
      })

      // Create filled mesh from polygon
      const _mesh = polyGeom.getMeshObject({
        ellipsoid: WGS84_ELLIPSOID,
        thickness: 0,
        resolution: 2.5,
      })

      // Create outline from polygon
      const _line = polyGeom.getLineObject({
        ellipsoid: WGS84_ELLIPSOID,
        resolution: 2.5,
        offset: 200,
      })

      // Add both to scene
      // scene.add(mesh);
      // scene.add(line);
    })
  }

  // Check for point data
  if (data.points && data.points.length > 0) {
    console.log(`Found ${data.points.length} point features`)
  }

  // Features array contains all individual features with their geometries organized
  if (data.features && data.features.length > 0) {
    console.log(`Total features: ${data.features.length}`)
    data.features.forEach((feature: any, index: number) => {
      console.log(`Feature ${index}:`, {
        type: feature.type,
        properties: feature.properties,
        polygons: feature.polygons?.length || 0,
        lines: feature.lines?.length || 0,
        points: feature.points?.length || 0,
      })
    })
  }
}

// Key differences between coastline and country data:

// 1. COASTLINE DATA (ne_50m_coastline.geojson):
//    - Contains LineString geometries
//    - Access via data.lines array
//    - Each line represents a coastline segment
//    - Properties: { scalerank: number, featureclass: "Coastline" }
//    - Use lineGeom.getLineObject() to create Three.js lines

// 2. COUNTRY POLYGON DATA (world.geojson):
//    - Contains Polygon/MultiPolygon geometries
//    - Access via data.polygons array
//    - Each polygon represents a country boundary
//    - Properties: { name: "Country Name", admin: "...", ... }
//    - Use polyGeom.getMeshObject() for filled shapes
//    - Use polyGeom.getLineObject() for outlines

// Example usage patterns:

// For coastlines (outline only):
// data.lines.forEach(lineGeom => {
//   const line = lineGeom.getLineObject({ ellipsoid: WGS84_ELLIPSOID });
//   scene.add(line);
// });

// For countries (filled + outline):
// data.polygons.forEach(polyGeom => {
//   const mesh = polyGeom.getMeshObject({ ellipsoid: WGS84_ELLIPSOID });
//   const outline = polyGeom.getLineObject({ ellipsoid: WGS84_ELLIPSOID });
//   scene.add(mesh);
//   scene.add(outline);
// });

// For specific country:
// const japan = data.polygons.find(p =>
//   p.feature?.properties?.name === "Japan"
// );
// if (japan) {
//   const mesh = japan.getMeshObject({ ellipsoid: WGS84_ELLIPSOID });
//   scene.add(mesh);
// }
