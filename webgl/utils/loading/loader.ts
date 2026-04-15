import { EventDispatcher } from 'three'

import Asset from './asset'
import LoaderManager from './loader-manager'

export class LoadingEnvironment {
  static Worker = 'Worker'
  static Main = 'Main'
}

export type LoaderSettings = {
  id: string
  preferWebWorker?: boolean
  parallelLoads: number
  environment?: LoadingEnvironment
}

export interface LoaderEvent {
  loaded: { asset: Asset }
  error: { error: unknown }
}

export const defaultLoaderSettings = {
  id: 'default',
  preferWebWorker: true,
  parallelLoads: 10,
  environment: LoadingEnvironment.Main,
}

/**
 * Loader base class
 *
 * @export
 * @class Loader
 */
class Loader extends EventDispatcher<LoaderEvent> {
  asset!: Asset
  assets: Array<Asset> = []
  type = ''
  settings: LoaderSettings = defaultLoaderSettings

  constructor(asset: Asset) {
    super()
    this.asset = asset
  }

  onProgress = () => {}

  onError = (error: unknown) => {
    this.dispatchEvent({ type: 'error', error })
  }

  load = (_settings?: LoaderSettings, _manager?: LoaderManager) => {}
}

export default Loader
