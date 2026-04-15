import { TWO_PI } from '@/webgl/utils/common/math'
import Time from '@/webgl/utils/common/time'
import gsap from 'gsap'
import { Mesh, RingGeometry, ShaderMaterial, UniformsUtils } from 'three'

import { fragmentShader, uniforms, vertexShader } from './shader.glsl'

export default class PreloaderObject extends Mesh<RingGeometry, ShaderMaterial> {
  name = 'Preloader'
  constructor() {
    const material = new ShaderMaterial({
      transparent: true,
      uniforms: UniformsUtils.clone(uniforms),
      vertexShader,
      fragmentShader,
    })
    super(new RingGeometry(0.9, 1, 32, 1, 0, TWO_PI * 0.75), material)
  }

  update() {
    this.rotation.z -= Time.delta * 2
  }

  animateInit() {
    gsap.killTweensOf(this.material.uniforms.opacity)
    this.material.uniforms.opacity.value = 0
  }

  async animateIn() {
    return new Promise(resolve => {
      gsap.to(this.material.uniforms.opacity, {
        duration: 1,
        value: 1,
        onComplete: () => {
          resolve(null)
        },
      })
    })
  }

  async animateOut() {
    return new Promise(resolve => {
      gsap.to(this.material.uniforms.opacity, {
        duration: 1,
        value: 0,
        onComplete: () => {
          resolve(null)
        },
      })
    })
  }
}
