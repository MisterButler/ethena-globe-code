import gsap, { Linear } from 'gsap'
import { Group, IcosahedronGeometry, Mesh, PerspectiveCamera, ShaderMaterial, SRGBColorSpace, Texture } from 'three'

import assetManager from '../../loading/asset-manager'
import renderManager from '../../rendering/render-manager'
import { Assets } from '../../types/types-webgl'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { Asset } from '@/webgl/utils/loading'

import shader, { GUILandShader } from './shader.glsl'

export default class Land extends Group {
  name = 'Land'
  mesh: Mesh<IcosahedronGeometry, ShaderMaterial>

  constructor(geometry: IcosahedronGeometry) {
    super()

    // Create shared uniforms for both meshes
    this.mesh = new Mesh(
      geometry,
      new ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        uniforms: shader.uniforms,
        vertexShader: shader.vertexShader,
      }),
    )

    this.add(this.mesh)
    // this.scale.setScalar(0.9);

    const asset = assetManager.get(Assets.Global, 'world-map')

    if (asset instanceof Asset) {
      const texture = asset.data as Texture
      texture.colorSpace = SRGBColorSpace

      texture.anisotropy = renderManager.renderer.capabilities.getMaxAnisotropy()

      this.mesh.material.uniforms.worldMap.value = texture
    }

    this.scale.setScalar(0.75)
    this.rotation.y = Math.PI // Rotate to align texture correctly

    this.stop()
  }

  play(delay = 0) {
    gsap.to(this.mesh.material.uniforms.powStrength, {
      delay,
      duration: 6,
      value: 0.1,
    })

    gsap.to(this.mesh.material.uniforms.opacity, {
      delay,
      duration: 3,
      value: 1,
    })

    gsap.to(this.mesh.material.uniforms.lightTransition, {
      delay: 3,
      duration: 20,
      ease: Linear.easeNone,
      value: 1,
    })
  }

  stop() {
    gsap.killTweensOf(this.mesh.material.uniforms.powStrength)
    this.mesh.material.uniforms.powStrength.value = 0
    gsap.killTweensOf(this.mesh.material.uniforms.opacity)
    this.mesh.material.uniforms.opacity.value = 0
    gsap.killTweensOf(this.mesh.material.uniforms.lightTransition)
    this.mesh.material.uniforms.lightTransition.value = 0
  }

  update(camera: PerspectiveCamera) {
    // Update both meshes
    this.mesh.material.uniforms.cameraPosition.value.copy(camera.position)
  }
}

/* #if DEBUG */
export class GUILand extends GUIController {
  constructor(gui: GUIType, target: Land) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Land' })

    this.controllers.shader = new GUILandShader(this.gui, target.mesh.material)
  }
}
/* #endif */
