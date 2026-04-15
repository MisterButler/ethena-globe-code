import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

import { validateAssetUrlStrict } from '../common/security-utils'

import Loader, { LoaderSettings } from './loader'
import LoaderManager from './loader-manager'

const loader = new GLTFLoader()

/**
 * Threejs GLTF Loader
 *
 * @export
 * @class ThreeGLTFLoader
 * @extends {Loader}
 */
export default class ThreeGLTFLoader extends Loader {
  setDracoLoader(dracoLoader: DRACOLoader) {
    loader.setDRACOLoader(dracoLoader)
  }

  setKtx2Loader(ktx2Loader: KTX2Loader) {
    loader.setKTX2Loader(ktx2Loader)
  }

  setMeshoptDecoder(decoder: typeof MeshoptDecoder) {
    loader.setMeshoptDecoder(decoder)
  }

  load = (settings?: LoaderSettings, manager: LoaderManager = new LoaderManager('three-gltf-loader')) => {
    if (settings) {
      this.settings = Object.assign(this.settings, settings)
    }

    manager.add(this)

    // Validate asset URL before loading
    if (!validateAssetUrlStrict(this.asset.src, 'gltf')) {
      this.dispatchEvent({
        error: new Error(`Invalid GLTF URL: ${this.asset.src}`),
        type: 'error',
      })

      return
    }

    const onLoaded = (gltf: unknown) => {
      this.asset.data = gltf
      this.dispatchEvent({ asset: this.asset, type: 'loaded' })
    }

    loader.load(this.asset.src, onLoaded, this.onProgress, this.onError)
  }
}
