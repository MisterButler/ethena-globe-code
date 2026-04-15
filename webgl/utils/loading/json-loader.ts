import { validateAssetUrlStrict } from '../common/security-utils'

import Loader, { LoaderSettings } from './loader'
import LoaderManager from './loader-manager'

/**
 * Json loader
 *
 * @export
 * @class JsonLoader
 * @extends {Loader}
 */
export default class JsonLoader extends Loader {
  load = (settings?: LoaderSettings, manager: LoaderManager = new LoaderManager('json-loader')) => {
    if (settings) {
      this.settings = Object.assign(this.settings, settings)
    }

    manager.add(this)

    // Validate asset URL before loading
    if (!validateAssetUrlStrict(this.asset.src, 'json')) {
      this.dispatchEvent({
        error: new Error(`Invalid JSON URL: ${this.asset.src}`),
        type: 'error',
      })

      return
    }

    fetch(this.asset.src)
      .then(response => response.json())
      .then((data: Record<string, unknown>) => {
        this.asset.data = data
        this.dispatchEvent({ asset: this.asset, type: 'loaded' })
      })
      .catch(this.onError)
  }
}
