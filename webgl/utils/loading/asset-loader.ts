import { AudioListener } from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import Asset, { AssetType } from './asset'
import Loader, { LoaderSettings } from './loader'
import LoaderManager from './loader-manager'
import ParallelLoader from './parallel-loader'
import ThreeFBXLoader from './three-fbx-loader'
import ThreeGeoJsonLoader from './three-geojson-loader'
import ThreeGLTFLoader from './three-gltf-loader'
import ThreeTextureLoader from './three-texture-loader'

export default class AssetLoader extends ParallelLoader {
  dracoLoader?: DRACOLoader
  meshoptDecoder?: typeof MeshoptDecoder
  audioListener?: AudioListener

  constructor(settings: LoaderSettings, manager: LoaderManager = new LoaderManager('asset-loader')) {
    super(settings, manager)
    this.loaderClasses = Object.assign(this.loaderClasses, {
      [AssetType.Texture]: ThreeTextureLoader,
      [AssetType.FBX]: ThreeFBXLoader,
      [AssetType.GLTF]: ThreeGLTFLoader,
      [AssetType.GeoJson]: ThreeGeoJsonLoader,
    })
  }

  setDracoLoader(dracoLoader: DRACOLoader) {
    this.dracoLoader = dracoLoader
  }

  setMeshoptDecoder(decoder: typeof MeshoptDecoder) {
    this.meshoptDecoder = decoder
  }

  setAudioListener(audioListener: AudioListener) {
    this.audioListener = audioListener
  }

  createLoaders(manifest: Asset[]) {
    manifest.forEach(asset => {
      if (asset.args === undefined) asset.args = {}
      if (this.loaderClasses[asset.type as string] !== undefined) {
        // Use worker loader for asset types it supports

        const loader = new this.loaderClasses[asset.type as string](asset)
        this.loaders.push(loader)
      } else {
        console.log('webgl', `No loader found for media type: ${asset.type} `)
      }
    })
  }

  nextInQueue(loader: Loader) {
    function logMissingConfiguration(fn: string, fileType: string) {
      console.error(`${fn} needs to be called before loading an ${fileType} file`)
    }
    if (loader instanceof ThreeGLTFLoader) {
      if (this.dracoLoader) {
        loader.setDracoLoader(this.dracoLoader)
      } else {
        logMissingConfiguration('setDracoLoader', 'gltf')
      }
      if (this.meshoptDecoder) {
        loader.setMeshoptDecoder(this.meshoptDecoder)
      } else {
        logMissingConfiguration('setMeshoptDecoder', 'gltf')
      }
    }
  }
}
