import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

import { validateAssetUrlStrict } from '../common/security-utils'

import Loader, { LoaderSettings } from './loader'
import LoaderManager from './loader-manager'

const loader = new FBXLoader()

/**
 * Threejs FBX Loader
 *
 * @export
 * @class ThreeFBXLoader
 * @extends {Loader}
 */
export default class ThreeFBXLoader extends Loader {
  load = (settings?: LoaderSettings, manager: LoaderManager = new LoaderManager('three-fbx-loader')) => {
    if (settings) {
      this.settings = Object.assign(this.settings, settings)
    }

    manager.add(this)

    // Validate asset URL before loading
    if (!validateAssetUrlStrict(this.asset.src, 'fbx')) {
      this.dispatchEvent({
        error: new Error(`Invalid FBX URL: ${this.asset.src}`),
        type: 'error',
      })

      return
    }

    const onLoaded = (fbx: unknown) => {
      this.asset.data = fbx
      this.dispatchEvent({ asset: this.asset, type: 'loaded' })
    }

    loader.load(this.asset.src, onLoaded, this.onProgress, this.onError)
  }
}
