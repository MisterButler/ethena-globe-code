import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import {
  BackSide,
  FrontSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  ShaderMaterial,
} from 'three'

import shader, { GUIVignetteShader } from './shader.glsl'
import gsap from 'gsap'

function cloneUniforms(uniforms: any) {
  const out: any = {}
  for (const k in uniforms) {
    const v = uniforms[k].value
    if (v && typeof (v as any).clone === 'function') {
      out[k] = { value: (v as any).clone() }
    } else {
      out[k] = { value: v }
    }
  }
  return out
}

const innerFragmentShader = /* glsl */ `
  uniform vec3 color;
  uniform vec2 remapRange;
  uniform float powStrength;
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    float f = 1.0 - abs(dot(vViewDirection, normalize(vNormal)));
    f = smoothstep(remapRange.x, remapRange.y, f);
    f = pow(f, powStrength);
    gl_FragColor = vec4(color, clamp(f, 0.0, 1.0) * opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default class Vignette extends Group {
  name = 'Vignette'
  private outerMesh: Mesh<IcosahedronGeometry, ShaderMaterial>
  private innerMesh: Mesh<IcosahedronGeometry, ShaderMaterial>

  constructor(geometry: IcosahedronGeometry) {
    super()

    this.outerMesh = new Mesh(
      geometry,
      new ShaderMaterial({
        uniforms: cloneUniforms(shader.uniforms),
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
        side: BackSide,
        transparent: true,
      }),
    )
    this.outerMesh.scale.setScalar(2)
    this.add(this.outerMesh)

    this.innerMesh = new Mesh(
      geometry,
      new ShaderMaterial({
        uniforms: cloneUniforms(shader.uniforms),
        vertexShader: shader.vertexShader,
        fragmentShader: innerFragmentShader,
        side: FrontSide,
        transparent: true,
        depthWrite: false,
      }),
    )
    this.innerMesh.scale.setScalar(0.76)
    this.add(this.innerMesh)

    this.stop()
  }

  update(camera: PerspectiveCamera) {
    this.outerMesh.material.uniforms.cameraPosition.value.copy(camera.position)
    this.innerMesh.material.uniforms.cameraPosition.value.copy(camera.position)
  }

  play(delay = 0) {
    this.stop()
    gsap.to(this.outerMesh.material.uniforms.opacity, { value: 1, duration: 3, delay })
    gsap.to(this.outerMesh.material.uniforms.powStrength, { value: 100, duration: 3, delay })
    gsap.to(this.innerMesh.material.uniforms.opacity, { value: 0.6, duration: 3, delay })
    gsap.to(this.innerMesh.material.uniforms.powStrength, { value: 3, duration: 3, delay })
  }

  stop() {
    ;[this.outerMesh, this.innerMesh].forEach(m => {
      gsap.killTweensOf(m.material.uniforms.opacity)
      gsap.killTweensOf(m.material.uniforms.powStrength)
    })
    this.outerMesh.material.uniforms.opacity.value = 0
    this.outerMesh.material.uniforms.powStrength.value = 200
    this.innerMesh.material.uniforms.opacity.value = 0
    this.innerMesh.material.uniforms.powStrength.value = 10
  }

  // Outer material is the "primary" vignette — preserves existing GUI + setGlobeStyle access
  get material() {
    return this.outerMesh.material
  }

  get inner() {
    return this.innerMesh.material
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
