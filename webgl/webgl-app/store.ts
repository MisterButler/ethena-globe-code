class WebGLAppStore {
  data: { [key: string]: unknown } = {}

  constructor() {
    const data = window.localStorage.getItem('webgl-app')
    if (data) {
      this.data = JSON.parse(data)
    }
  }

  set<T>(group: string = 'global', key: string, value: T) {
    if (!this.data[group] || typeof this.data[group] !== 'object') {
      this.data[group] = {}
    }
    ;(this.data[group] as { [key: string]: unknown })[key] = value

    window.localStorage.setItem('webgl-app', this.serialize())
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
    return window.localStorage.getItem('webgl-app')
  }

  serialize() {
    return JSON.stringify(this.data)
  }
}

const store = new WebGLAppStore()

export default store
