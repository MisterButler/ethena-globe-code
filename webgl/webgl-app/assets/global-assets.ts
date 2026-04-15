import Asset, { AssetGroup, AssetType } from '@/webgl/utils/loading/asset'

import { Assets } from '../types/types-webgl'
import { detect } from '@/webgl/utils/common/detect'

const assets: Array<Asset> = [
  new Asset({
    id: 'heightmap',
    src: `/webgl/heightmap.png`,
    type: AssetType.Texture,
  }),
  new Asset({
    id: 'lines',
    src: `/webgl/animation.png`,
    type: AssetType.Texture,
  }),
]

if (detect.device.desktop) {
  assets.push(
    new Asset({
      id: 'world-map',
      src: `/webgl/world-desktop.png`,
      type: AssetType.Texture,
    }),
    new Asset({
      id: 'coastline',
      src: '/webgl/coastline.geojson',
      type: AssetType.GeoJson,
    }),
  )
}

const assetGroup: AssetGroup = {
  id: Assets.Global,
  assets,
}

export default assetGroup
