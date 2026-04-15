import { EventDispatcher } from 'three'

import Asset, { AssetType } from './asset'
import ImageLoader from './image-loader'
import JsonLoader from './json-loader'
import Loader, { defaultLoaderSettings, LoaderEvent, LoaderSettings } from './loader'
import LoaderManager from './loader-manager'

export type LoaderClasses = {
  [key: string]: Loader
}

export interface ParallelLoaderEvent {
  loaded: { assets: Asset[] }
  progress: { progress: number; loaded: number; total: number }
  error: { error: unknown }
}

/**
 * Parallel Loader loads an array of assets based on their asset types
 *
 * @export
 * @class ParallelLoader
 * @extends {EventEmitter}
 */
export default class ParallelLoader extends EventDispatcher<ParallelLoaderEvent> {
  settings: LoaderSettings = defaultLoaderSettings
  loaderClasses = {
    [AssetType.Image]: ImageLoader,
    [AssetType.Json]: JsonLoader,
  }
  loaders: Array<Loader> = []
  queue = 0
  loaded = 0
  total = 0
  current = 0
  manager!: LoaderManager

  constructor(
    settings: LoaderSettings = defaultLoaderSettings,
    manager: LoaderManager = new LoaderManager('parallel-loader'),
  ) {
    super()
    this.settings = Object.assign(this.settings, settings)
    this.manager = manager
  }

  webWorkersSupported() {
    return !!window.Worker
  }

  registerLoaders(loaders: LoaderClasses) {
    this.loaderClasses = Object.assign(this.loaderClasses, loaders)
  }

  createLoaders(manifest: Asset[]) {
    manifest.forEach((asset: Asset) => {
      if (asset.args === undefined) asset.args = {}
      if (this.loaderClasses[asset.type as string] !== undefined) {
        const loader = new this.loaderClasses[asset.type as string](asset)
        this.loaders.push(loader)
      } else {
        console.log('webgl', `No loader found for media type: ${asset.type} `)
      }
    })
  }

  /**
   * Load an array of assets
   *
   * @param {Asset[]} manifest
   * @memberof ParallelLoader
   */
  load = (assets: Asset[]) => {
    this.loaders = []
    this.createLoaders(assets)
    this.loaded = 0
    this.queue = 0
    this.current = 0
    this.total = this.loaders.length

    if (this.total === 0) {
      this.dispatchEvent({ type: 'loaded', assets })
    } else {
      this.loadNextInQueue()
    }
  }

  // Hook to implement custom logic based on the loader type
  nextInQueue(_loader: Loader) {}

  loadNextInQueue = () => {
    if (this.queue < this.total) {
      if (this.current < this.settings.parallelLoads) {
        const loader = this.loaders[this.queue]
        this.queue += 1
        this.current += 1
        this.nextInQueue(loader)
        loader.addEventListener('loaded', this.onLoaded)
        loader.addEventListener('error', this.onError)
        loader.load(this.settings, this.manager)
        this.loadNextInQueue()
      }
    }
  }

  checkAssetInstance(asset: Asset) {
    if (!(asset instanceof Asset)) {
      return new Asset().fromObject(asset)
    }
    return asset
  }

  /**
   * Loaded handler
   *
   * @memberof ParallelLoader
   */
  onLoaded = () => {
    this.loaded += 1
    // Note: This will report progress per loader
    // It's advised to listen to the progress of LoaderManager to get more accurate loading for all files
    this.dispatchEvent({
      //
      type: 'progress',
      progress: this.loaded / this.total,
      loaded: this.loaded,
      total: this.total,
    })
    if (this.loaded === this.total) {
      const assets: Array<Asset> = []
      this.loaders.forEach((loader: Loader) => {
        loader.asset = this.checkAssetInstance(loader.asset)
        if (loader.type === 'WorkerLoader') {
          assets.push(
            ...loader.assets.map(asset => {
              return this.checkAssetInstance(asset)
            }),
          )
        } else {
          assets.push(loader.asset)
        }
      })
      this.dispatchEvent({ type: 'loaded', assets })
    } else {
      this.current -= 1
      this.loadNextInQueue()
    }
  }

  /**
   * Error handler
   *
   * @param {string} error
   * @memberof ParallelLoader
   */
  onError = (event: LoaderEvent['error']) => {
    this.dispatchEvent({ type: 'error', error: event.error })
  }
}
