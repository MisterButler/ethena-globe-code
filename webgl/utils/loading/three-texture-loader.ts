import type { Texture } from 'three'
import { CanvasTexture, ImageBitmapLoader, LinearFilter, MathUtils, TextureLoader } from 'three'

import { detect } from '../common/detect'
import { validateAssetUrlStrict } from '../common/security-utils'

import type { LoaderSettings } from './loader'
import Loader from './loader'
import LoaderManager from './loader-manager'

function validateTextureSize(width: number, height: number, texture: Texture) {
  if (!(MathUtils.isPowerOfTwo(width) && MathUtils.isPowerOfTwo(height))) {
    texture.generateMipmaps = false
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
  }
}

const textureLoader = new TextureLoader()

/**
 * Threejs texture loader
 *
 * @export
 * @class ThreeTextureLoader
 * @extends {Loader}
 */
export default class ThreeTextureLoader extends Loader {
  // Same detection as
  // https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js#L2407
  bitmapSupported() {
    return !(
      typeof createImageBitmap === 'undefined' ||
      detect.browser.safari ||
      (detect.browser.firefox && detect.browser.majorVersion < 98)
    )
  }

  load = (settings?: LoaderSettings, manager: LoaderManager = new LoaderManager('three-texture-loader')) => {
    if (settings) {
      this.settings = Object.assign(this.settings, settings)
    }

    manager.add(this)

    // Validate asset URL before loading
    if (!validateAssetUrlStrict(this.asset.src, 'texture')) {
      this.dispatchEvent({
        error: new Error(`Invalid texture URL: ${this.asset.src}`),
        type: 'error',
      })

      return
    }

    // Threejs:
    // Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
    // expensive work of uploading a texture to the GPU off the main thread.

    if (this.bitmapSupported()) {
      const imageBitmapLoader = new ImageBitmapLoader()

      const options: { [key: string]: string } = {
        imageOrientation: 'flipY',
      }

      if (this.asset.args.premultiplyAlpha) {
        options.premultiplyAlpha = 'none'
      }

      imageBitmapLoader.setOptions(options)

      const onLoaded = (data: ImageBitmap) => {
        const texture = new CanvasTexture(data)
        validateTextureSize(texture.image.width, texture.image.height, texture)
        this.asset.data = texture
        this.dispatchEvent({ asset: this.asset, type: 'loaded' })
      }

      imageBitmapLoader.load(this.asset.src, onLoaded, this.onProgress, this.onError)
    } else {
      const onLoaded = (texture: Texture) => {
        this.asset.data = texture
        this.dispatchEvent({ asset: this.asset, type: 'loaded' })
      }

      textureLoader.load(this.asset.src, onLoaded, this.onProgress, this.onError)
    }
  }
}
