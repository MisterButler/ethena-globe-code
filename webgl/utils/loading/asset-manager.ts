import { Audio, AudioListener, WebGLRenderer } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { disposeObjects, disposeTexture } from '../common/memory'
import Asset, { AssetType } from './asset'
import AssetLoader from './asset-loader'
import { ParallelLoaderEvent } from './parallel-loader'

export type Assets = {
  [propName: string]: Array<Asset>
}

/**
 * Asset manager's purpose is to store loaded assets by the AssetLoader
 * Assets can be retrived by using the get() function
 *
 * @class AssetManager
 */
class AssetManager {
  assets: Assets = {}
  loader = new AssetLoader({ id: 'asset-manager', parallelLoads: 10 })

  setup(renderer: WebGLRenderer, baseUrl: string) {}

  setAudioListener(listener: AudioListener) {
    this.loader.setAudioListener(listener)
  }

  load = (
    id: string,
    assets: Asset[],
    onLoadedCallback: (value: unknown) => void,
    onErrorCallback?: (error: unknown) => void,
    onProgressCallback?: (percent: number) => void,
  ) => {
    assets.forEach(asset => {
      if (asset.args === undefined) asset.args = {}
    })

    const onProgress = (event: ParallelLoaderEvent['progress']) => {
      if (onProgressCallback) onProgressCallback(event.progress)
    }

    const onError = (event: ParallelLoaderEvent['error']) => {
      if (onErrorCallback) onErrorCallback(event.error)
      unsubscribe()
    }

    const onLoaded = (event: ParallelLoaderEvent['loaded']) => {
      this.add(id, event.assets)
      unsubscribe()
      onLoadedCallback(null)
    }

    const unsubscribe = () => {
      this.loader.removeEventListener('progress', onProgress)
      this.loader.removeEventListener('loaded', onLoaded)
      this.loader.removeEventListener('error', onError)
    }

    this.loader.addEventListener('progress', onProgress)
    this.loader.addEventListener('loaded', onLoaded)
    this.loader.addEventListener('error', onError)

    this.loader.load(assets)
  }

  /**
   * Add an asset group
   *
   * @param {String} group
   * @param {Asset[]} assets
   * @memberof AssetManager
   */
  add(group: string, assets: Asset[]) {
    this.assets[group] = this.assets[group] || []
    this.assets[group].push(...assets)
  }

  /**
   * Retrieve an asset by id
   *
   * @param {String} groupId
   * @param {String} id
   * @param {Boolean} [all=false]
   * @returns
   * @memberof AssetManager
   */
  get(groupId: string, id: string): boolean | Asset {
    if (!this.assets[groupId]) {
      return false
    }
    const asset = this.find(this.assets[groupId], id)
    if (asset && asset instanceof Asset) {
      return asset
    }
    return false
  }

  /**
   * Find an asset by id
   *
   * @param {Asset[]} assets
   * @param {String} id
   * @returns
   * @memberof AssetManager
   */
  find(assets: Asset[], id: string): boolean | Asset {
    return assets.find(asset => asset.id === id) || false
  }

  removeAsset(groupId: string, assetId: string, dispose = false) {
    if (this.assets[groupId]) {
      const asset = this.get(groupId, assetId)
      if (asset instanceof Asset) {
        const idx = this.assets[groupId].indexOf(asset)
        this.assets[groupId].splice(idx, 1)
        if (dispose) {
          this.disposeAsset(asset)
        }
      }
    }
  }

  /**
   * Dispose of all assets in a group
   *
   * @param {string} groupId
   * @memberof AssetManager
   */
  disposeGroup(groupId: string) {
    if (this.assets[groupId]) {
      this.assets[groupId].forEach(asset => {
        this.disposeAsset(asset)
      })
      delete this.assets[groupId]
    }
  }

  disposeAsset(asset: Asset) {
    switch (asset.type) {
      case AssetType.GLTF: {
        disposeObjects((asset.data as GLTF)?.scene)
        asset.data = null
        break
      }
      case AssetType.Sound: {
        if (asset.data instanceof Audio && asset.data.source) {
          asset.data.disconnect()
        }
        asset.data = null
        break
      }
      case AssetType.Texture:
      case AssetType.Ktx2Texture:
      case AssetType.ExrTexture: {
        disposeTexture(asset.data)
        asset.data = null
        break
      }
      default:
        asset.data = null
        break
    }
  }

  /**
   * Dispose of all assets
   *
   * @memberof AssetManager
   */
  dispose() {
    Object.keys(this.assets).forEach(id => {
      this.disposeGroup(id)
    })
    this.assets = {}
  }
}

export default AssetManager
