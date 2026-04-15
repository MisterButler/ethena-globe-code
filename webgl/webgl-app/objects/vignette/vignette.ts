import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { BackSide, Group, IcosahedronGeometry, Mesh, PerspectiveCamera, ShaderMaterial } from 'three'

import shader, { GUIVignetteShader } from './shader.glsl'
import gsap from 'gsap'

export default class Vignette extends Group {
  name = 'Vignette'
  private mesh: Mesh<IcosahedronGeometry, ShaderMaterial>

  constructor(geometry: IcosahedronGeometry) {
    super()

    this.mesh = new Mesh(
      geometry,
      new ShaderMaterial({
        uniforms: shader.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
        side: BackSide,
        transparent: true,
      }),
    )

    this.add(this.mesh)
    this.scale.setScalar(2)

    this.stop()
  }

  update(camera: PerspectiveCamera) {
    this.mesh.material.uniforms.cameraPosition.value.copy(camera.position)
  }

  play(delay = 0) {
    this.stop()
    gsap.to(this.material.uniforms.opacity, {
      value: 1,
      duration: 3,
      delay,
    })
    gsap.to(this.material.uniforms.powStrength, {
      value: 100,
      duration: 3,
      delay,
    })
  }

  stop() {
    gsap.killTweensOf(this.material.uniforms.opacity)
    gsap.killTweensOf(this.material.uniforms.powStrength)
    this.material.uniforms.opacity.value = 0
    this.material.uniforms.powStrength.value = 200
  }

  // Getter for backward compatibility with GUI
  get material() {
    return this.mesh.material
  }
}

/* #if DEBUG */
export class GUIVignette extends GUIController {
  constructor(gui: GUIType, target: Vignette) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Vignette' })

    this.controllers.shader = new GUIVignetteShader(gui, target.material)
  }
}
/* #endif */
