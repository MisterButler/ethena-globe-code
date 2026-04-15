import { AnimationEaseInOut } from '@/webgl/webgl-app/types/types-webgl'
import gsap from 'gsap'
import { ShaderPass } from 'three/examples/jsm/Addons.js'

import { TintPass as TintPassShader } from './shader.glsl'

export default class TintPass extends ShaderPass {
  constructor() {
    super(TintPassShader)
    // this.uniforms = UniformsUtils.merge([this.uniforms, TintPass.uniforms]);
  }

  setTransition(transition: number) {
    this.material.uniforms.transition.value = transition
  }

  animate(value: number, duration: number) {
    if (duration === 0) {
      this.setTransition(value)
      return Promise.resolve(null)
    }

    return new Promise(resolve => {
      gsap.killTweensOf(this.material.uniforms.transition)
      gsap.to(this.material.uniforms.transition, {
        value,
        duration,
        ease: AnimationEaseInOut,
        onComplete: () => {
          resolve(null)
        },
      })
    })
  }
}
