import gsap from 'gsap'
import {
  DoubleSide,
  Mesh,
  MirroredRepeatWrapping,
  NearestFilter,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three'

import assetManager from '../../loading/asset-manager'
import { Assets } from '../../types/types-webgl'
import ASCIITextureGenerator from '@/webgl/utils/common/ascii-texture-generator'
import { getScaleFromCamera } from '@/webgl/utils/common/math'
import Time from '@/webgl/utils/common/time'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { Asset } from '@/webgl/utils/loading'
import { getRenderBufferSize } from '@/webgl/utils/rendering/rendering'

import shader, { GUIBackgroundShader } from './shader.glsl'

export default class Background extends Object3D {
  name = 'Background'
  mesh: Mesh
  material: ShaderMaterial
  asciiGenerator: ASCIITextureGenerator

  constructor(public renderer: WebGLRenderer) {
    super()

    // Create shader material
    this.material = new ShaderMaterial({
      fragmentShader: shader.fragmentShader,
      side: DoubleSide,
      transparent: true,
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
    })

    const pixelRatio = renderer.getPixelRatio()
    this.material.uniforms.pixelRatio.value = pixelRatio

    const heightmapAsset = assetManager.get(Assets.Global, 'heightmap')

    if (heightmapAsset instanceof Asset) {
      const texture = heightmapAsset.data as Texture
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = NearestFilter
      texture.magFilter = NearestFilter
      texture.wrapS = MirroredRepeatWrapping
      texture.wrapT = MirroredRepeatWrapping
      this.material.uniforms.heightMap.value = texture
      const width = texture.source.data.width / 2
      const height = texture.source.data.height / 2

      this.material.uniforms.imageSize.value.set(width * pixelRatio, height * pixelRatio)
    }

    const linesAsset = assetManager.get(Assets.Global, 'lines')

    if (linesAsset instanceof Asset) {
      const texture = linesAsset.data as Texture
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = NearestFilter
      texture.magFilter = NearestFilter
      texture.wrapS = MirroredRepeatWrapping
      texture.wrapT = MirroredRepeatWrapping
      this.material.uniforms.linesMap.value = texture
    }

    this.mesh = new Mesh(new PlaneGeometry(2, 2), this.material)
    this.mesh.name = 'BackgroundMesh'
    this.mesh.position.set(0, 0, -5)
    this.add(this.mesh)

    const characters = './$ENA'

    this.asciiGenerator = new ASCIITextureGenerator({
      backgroundColor: '#000000',

      // Single row since we only need unique positions
      cellSize: 25,

      characters,

      fontFamily: 'monospace',

      fontSize: 20,
      gridHeight: 1,
      gridWidth: characters.length,
      jitter: false,
      jitterAmount: 0.0,
      textColor: '#ffffff',
    })

    this.material.uniforms.charCount.value = this.asciiGenerator.getOptions().characters.length

    // Generate initial ASCII texture
    const asciiTexture = this.asciiGenerator.generateTexture()
    this.material.uniforms.asciiTexture.value = asciiTexture

    // Object.assign(asciiTexture.image.style, {
    //   position: "absolute",
    //   top: "0",
    //   left: "50rem",
    //   zIndex: "1000",
    // });

    // document.body.appendChild(asciiTexture.image);

    const options = this.asciiGenerator.getOptions()

    this.material.uniforms.gridSize.value.set(options.gridWidth, options.gridHeight)

    this.material.uniforms.cellSize.value.set(11, 11)

    this.resize()
  }

  play(delay = 0) {
    gsap.to(this.material.uniforms.wipeProgress, {
      delay,
      duration: 10,
      value: 1,
    })
  }

  stop() {
    gsap.killTweensOf(this.material.uniforms.wipeProgress)
    this.material.uniforms.wipeProgress.value = 0
  }

  update(camera: PerspectiveCamera) {
    const { scaleX, scaleY } = getScaleFromCamera(
      camera.projectionMatrix,
      camera.aspect,
      Math.abs(camera.position.distanceTo(this.mesh.position)) / 2,
    )

    this.mesh.scale.set(scaleX, scaleY, 1)
    this.material.uniforms.time.value = Time.elapsedTime
  }

  resize() {
    const { height, width } = getRenderBufferSize(this.renderer)
    this.material.uniforms.resolution.value.set(width, height)
  }

  dispose(): void {}
}

/* #if DEBUG */
export class GUIBackground extends GUIController {
  constructor(gui: GUIType, target: Background) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Background' })

    this.controllers.shader = new GUIBackgroundShader(this.gui, target.material)
  }
}
/* #endif */
