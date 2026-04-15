export class AssetType {
  static Json = 'Json'
  static Image = 'Image'
  static FBX = 'FBX'
  static GLTF = 'GLTF'
  static Texture = 'Texture'
  static RgbeTexture = 'RgbeTexture'
  static Ktx2Texture = 'Ktx2Texture'
  static ExrTexture = 'ExrTexture'
  static Sound = 'Sound'
  static VideoTexture = 'VideoTexture'
  static UltraHDRTexture = 'UltraHDRTexture'
  static GeoJson = 'GeoJson'
}

export interface AssetConfig {
  id: string
  src: string
  type: AssetType
  args?: Record<string, unknown>
  data?: unknown
}

export type AssetGroup = {
  id: string
  assets: Asset[]
}

/**
 * Asset base class
 *
 * @export
 * @class Asset
 */
class Asset implements AssetConfig {
  id = ''
  src = ''
  type: AssetType = AssetType.Image
  args: Record<string, unknown> = {}
  data: unknown
  constructor(config: AssetConfig = { id: '', type: AssetType.Image, src: '' }) {
    Object.assign(this, config)
  }

  fromObject(obj: AssetConfig) {
    this.id = obj.id
    this.src = obj.src
    this.type = obj.type
    if (obj.args) this.args = obj.args
    if (obj.data) this.data = obj.data
    return this
  }
}

export default Asset
