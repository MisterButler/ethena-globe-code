import { safeJsonParse, validateStorageSize } from '../../common/security-utils'

interface GUIStoreData {
  [key: string]: unknown
}

class GUIStore {
  data: GUIStoreData = {}

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem('gui-store')

      if (data) {
        const parsedData = safeJsonParse<GUIStoreData>(data)

        if (parsedData) {
          this.data = parsedData
        } else {
          console.warn('Failed to parse GUI store data from localStorage, using defaults')
        }
      }
    }
  }

  set<T>(key: string, value: T) {
    this.data[key] = value

    if (typeof window !== 'undefined' && window.localStorage) {
      const serialized = this.serialize()

      if (validateStorageSize(serialized)) {
        window.localStorage.setItem('gui-store', serialized)
      } else {
        console.warn('GUI store data exceeds storage size limit, not saving')
      }
    }
  }

  get(key: string) {
    return this.data[key]
  }

  serialize() {
    return JSON.stringify(this.data)
  }
}

const store = new GUIStore()

export default store
