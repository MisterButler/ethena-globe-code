import { validateAssetUrlStrict } from '../common/security-utils'

import Loader, { LoaderSettings, LoadingEnvironment } from './loader'
import LoaderManager from './loader-manager'

/**
 * Image Loader
 *
 * @export
 * @class ImageLoader
 * @extends {Loader}
 */
export default class ImageLoader extends Loader {
  load = (settings?: LoaderSettings, manager: LoaderManager = new LoaderManager('image-loader')) => {
    if (settings) {
      this.settings = Object.assign(this.settings, settings)
    }

    manager.add(this)

    // Validate asset URL before loading
    if (!validateAssetUrlStrict(this.asset.src, 'image')) {
      this.dispatchEvent({
        error: new Error(`Invalid image URL: ${this.asset.src}`),
        type: 'error',
      })

      return
    }

    if (this.settings.environment === LoadingEnvironment.Worker && this.settings.preferWebWorker) {
      fetch(this.asset.src)
        .then(response => {
          response
            .blob()
            .then((blob: Blob) => {
              const type = blob.type.split('/')[1]

              if (/(gif|jpe?g|tiff?|png|webp)$/i.test(type)) {
                this.asset.data = URL.createObjectURL(blob)
                this.dispatchEvent({ asset: this.asset, type: 'loaded' })
              } else {
                this.onError(`Image type not supported: ${type}`)
              }
            })
            .catch(this.onError)
        })
        .catch(this.onError)
    } else {
      const image = new Image()
      image.crossOrigin = 'anonymous'

      image.onload = () => {
        this.asset.data = image
        this.dispatchEvent({ asset: this.asset, type: 'loaded' })
      }

      image.onerror = this.onError
      image.src = this.asset.src
    }
  }
}
