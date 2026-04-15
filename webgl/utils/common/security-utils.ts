/**
 * Security utilities for safe data handling in WebGL application
 */

import DOMPurify from 'dompurify'

/**
 * Allowed URL patterns for asset loading
 * These represent the only URLs that should be allowed for loading assets
 */
const ALLOWED_URL_PATTERNS = [
  // Local webgl assets
  /^\/webgl\//,
  // Relative paths without protocol
  /^[^:/]+\.(png|jpg|jpeg|gif|svg|webp|glb|gltf|fbx|json|geojson)$/i,
  // Local assets starting with ./
  /^\.\/[^:/]+\.(png|jpg|jpeg|gif|svg|webp|glb|gltf|fbx|json|geojson)$/i,
] as const

/**
 * Validate asset URLs against whitelist
 * This is the main security control for asset loading
 */
export function validateAssetUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    console.warn('Invalid URL: not a string')
    return false
  }

  // Check against allowed local patterns first
  for (const pattern of ALLOWED_URL_PATTERNS) {
    if (pattern.test(url)) {
      return true
    }
  }

  // If it's a full URL, only allow same origin
  try {
    const urlObj = new URL(url)

    // Only allow HTTPS for external URLs (never HTTP)
    if (urlObj.protocol !== 'https:' && urlObj.hostname !== 'localhost') {
      console.warn(`Rejected non-HTTPS URL: ${url}`)
      return false
    }

    // Only allow same origin
    const isSameOrigin = urlObj.origin === window.location.origin

    if (!isSameOrigin) {
      console.warn(`Rejected URL from external domain: ${urlObj.hostname}`)
      return false
    }

    return true
  } catch {
    console.warn('Invalid URL format:', url)
    return false
  }
}

/**
 * Enhanced asset URL validation with detailed logging
 * Use this for production environments where you need audit trails
 */
export function validateAssetUrlStrict(url: string, assetType?: string): boolean {
  const isValid = validateAssetUrl(url)

  if (!isValid) {
    console.error(`SECURITY: Blocked asset loading attempt`, {
      assetType,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      url,
      userAgent: navigator.userAgent,
    })
  }

  return isValid
}

/**
 * Safely parse JSON with error handling and basic validation
 */
export function safeJsonParse<T>(jsonString: string, validator?: (obj: unknown) => obj is T): T | null {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      console.warn('Invalid JSON input: not a string')
      return null
    }

    const parsed: unknown = JSON.parse(jsonString)

    // Basic type validation
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('Invalid JSON structure: not an object')
      return null
    }

    // Optional schema validation
    if (validator && !validator(parsed)) {
      console.warn('JSON data failed validation')
      return null
    }

    return parsed as T
  } catch {
    console.error('JSON parsing failed')
    return null
  }
}

/**
 * Basic JSON validation - just checks if it's a valid object
 * Use this for general JSON files that don't need specific schema validation
 */
export function validateBasicJSON(data: unknown): boolean {
  return data !== null && typeof data === 'object'
}

/**
 * GeoJSON type definitions
 */
export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: unknown
  }
  properties?: Record<string, unknown>
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

/**
 * Validate GeoJSON structure (for raw GeoJSON data, not Three.js processed objects)
 * Use this only when you receive raw GeoJSON, not when using libraries like three-geojson
 */
export function validateGeoJSON(data: unknown): data is GeoJSONFeatureCollection {
  if (!data || typeof data !== 'object') {
    return false
  }

  const obj = data as Record<string, unknown>

  if (obj.type !== 'FeatureCollection') {
    return false
  }

  if (!Array.isArray(obj.features)) {
    return false
  }

  // Basic feature validation
  return obj.features.every((feature: unknown) => {
    if (!feature || typeof feature !== 'object') {
      return false
    }

    const f = feature as Record<string, unknown>
    return (
      f.type === 'Feature' &&
      f.geometry &&
      typeof f.geometry === 'object' &&
      typeof (f.geometry as Record<string, unknown>).type === 'string'
    )
  })
}

/**
 * Safe DOM text content setter (alternative to innerHTML)
 */
export function safeSetTextContent(element: HTMLElement, content: string): void {
  // Clear existing content
  element.textContent = ''

  // Set new content as text (not HTML)
  element.textContent = content
}

/**
 * Safe DOM HTML setter with robust sanitization using DOMPurify
 * This properly handles all XSS vectors including script tags, event handlers,
 * javascript:, data:, vbscript: URLs, and malformed HTML
 */
export function safeSetInnerHTML(element: HTMLElement, html: string): void {
  // Use DOMPurify for comprehensive HTML sanitization
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ['class', 'id', 'href'],
    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'a'],
  })

  element.innerHTML = sanitized
}

/**
 * Storage size limit (1MB)
 */
export const MAX_STORAGE_SIZE = 1024 * 1024

/**
 * Validate storage data size
 */
export function validateStorageSize(data: string): boolean {
  return data.length <= MAX_STORAGE_SIZE
}
