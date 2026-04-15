import { safeJsonParse, validateStorageSize } from './utils/common/security-utils'

interface WebGLAppData {
  [key: string]: unknown
}

class WebGLAppStore {
  data: WebGLAppData = {}

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem('webgl-app')

      if (data) {
        const parsedData = safeJsonParse<WebGLAppData>(data)

        if (parsedData) {
          this.data = parsedData
        } else {
          console.warn('Failed to parse WebGL app data from localStorage, using defaults')
        }
      }
    }
  }

  set<T>(group: string = 'global', key: string, value: T) {
    if (!this.data[group] || typeof this.data[group] !== 'object') {
      this.data[group] = {}
    }

    ;(this.data[group] as { [key: string]: unknown })[key] = value

    if (typeof window !== 'undefined' && window.localStorage) {
      const serialized = this.serialize()

      if (validateStorageSize(serialized)) {
        window.localStorage.setItem('webgl-app', serialized)
      } else {
        console.warn('WebGL app data exceeds storage size limit, not saving')
      }
    }
  }

  get(group: string = 'global', key: string) {
    if (this.data[group] && typeof this.data[group] === 'object') {
      return (this.data[group] as { [key: string]: unknown })[key]
    }

    return undefined
  }

  getGroup(group: string) {
    return this.data[group] ?? {}
  }

  getJson() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('webgl-app')
    }

    return null
  }

  serialize() {
    return JSON.stringify(this.data)
  }
}

const store = new WebGLAppStore()

export default store
