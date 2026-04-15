import { EventDispatcher } from 'three'

import Loader from './loader'

export interface LoaderManagerEvent {
  progress: { progress: number }
}

export default class LoaderManager extends EventDispatcher<LoaderManagerEvent> {
  id = ''
  loaders: Array<Loader> = []
  loaded = 0
  progress = 0
  total = 0

  constructor(id: string) {
    super()
    this.id = id
  }

  onProgress = () => {
    this.loaded++
    this.progress = this.loaded / this.total
    this.dispatchEvent({ type: 'progress', progress: this.progress })
  }

  add(loader: Loader) {
    this.loaders.push(loader)
    this.total = this.loaders.length
    loader.addEventListener('loaded', this.onProgress)
  }

  reset() {
    this.loaded = 0
    this.progress = 0
    this.loaders = []
  }
}
