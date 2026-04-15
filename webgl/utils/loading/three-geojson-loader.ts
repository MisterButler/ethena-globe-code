import { GeoJSONLoader } from 'three-geojson'

import { validateAssetUrlStrict } from '../common/security-utils'

import Loader, { LoaderSettings } from './loader'
import LoaderManager from './loader-manager'

export default class ThreeGeoJsonLoader extends Loader {
  load = (settings?: LoaderSettings, manager: LoaderManager = new LoaderManager('three-geo-json-loader')) => {
    if (settings) {
      this.settings = Object.assign(this.settings, settings)
    }

    manager.add(this)

    // Validate asset URL before loading
    if (!validateAssetUrlStrict(this.asset.src, 'geojson')) {
      this.dispatchEvent({
        error: new Error(`Invalid GeoJSON URL: ${this.asset.src}`),
        type: 'error',
      })

      return
    }

    const loader = new GeoJSONLoader()

    const onLoaded = (data: unknown) => {
      // The three-geojson library already validates and processes the GeoJSON data
      // and returns a Three.js Group object, so no additional validation needed
      this.asset.data = data
      this.dispatchEvent({ asset: this.asset, type: 'loaded' })
    }

    const onError = (error: unknown) => {
      console.error('GeoJSON loading error:', error)

      this.dispatchEvent({
        error: error instanceof Error ? error : new Error('GeoJSON loading failed'),
        type: 'error',
      })
    }

    loader.loadAsync(this.asset.src).then(onLoaded).catch(onError)
  }
}
