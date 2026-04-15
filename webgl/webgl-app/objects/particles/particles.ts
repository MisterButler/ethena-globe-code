import gsap from 'gsap'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  FrontSide,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Points,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

import assetManager from '../../loading/asset-manager'
import { Assets } from '../../types/types-webgl'
import { randomItem } from '@/webgl/utils/common/basic-functions'
import { randomSpherePoint } from '@/webgl/utils/common/math'
import Time from '@/webgl/utils/common/time'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { Asset } from '@/webgl/utils/loading'

import particlesShader, { GUIParticleShader } from './particles.glsl'

const position = new Vector3()
const color = new Color()

export default class Particles extends Object3D {
  name = 'Particles'

  settings = {
    colors: {
      color0: '#7ea2f3',
      color1: '#8eb2ff',
    },
    particleSize: new Vector2(1, 2),
    radius: new Vector2(0.751, 0.751),
    totalParticles: 75000,
  }

  attributes: {
    [key: string]: BufferAttribute
  } = {}

  mesh!: Points<BufferGeometry, ShaderMaterial>
  material: ShaderMaterial

  animation = {
    delay: 5,
    duration: 10,
  }

  enableTime = false

  isAnimating = false

  tween0?: gsap.core.Tween
  tween1?: gsap.core.Tween

  constructor(public renderer: WebGLRenderer) {
    super()

    this.material = new ShaderMaterial({
      blending: AdditiveBlending,
      depthTest: false,
      fragmentShader: particlesShader.fragmentShader,
      side: FrontSide,
      transparent: true,
      uniforms: UniformsUtils.merge([UniformsUtils.clone(particlesShader.uniforms)]),
      vertexShader: particlesShader.vertexShader,
    })

    this.material.uniforms.pixelRatio.value = this.renderer.getPixelRatio()

    this.generate()
  }

  generate = () => {
    if (this.mesh) {
      this.mesh.geometry.dispose()
      this.remove(this.mesh)
    }

    this.attributes.position = new BufferAttribute(new Float32Array(this.settings.totalParticles * 3), 3)

    this.attributes.color = new BufferAttribute(new Float32Array(this.settings.totalParticles * 3), 3)

    this.attributes.size = new BufferAttribute(new Float32Array(this.settings.totalParticles), 1)

    this.attributes.phase = new BufferAttribute(new Float32Array(this.settings.totalParticles), 1)

    this.attributes.reveal = new BufferAttribute(new Float32Array(this.settings.totalParticles), 1)

    this.attributes.revealOffset = new BufferAttribute(new Float32Array(this.settings.totalParticles), 1)

    const geometry = new BufferGeometry()
    geometry.setAttribute('size', this.attributes.size)
    geometry.setAttribute('position', this.attributes.position)
    geometry.setAttribute('phase', this.attributes.phase)
    geometry.setAttribute('reveal', this.attributes.reveal)
    geometry.setAttribute('color', this.attributes.color)

    this.mesh = new Points(geometry, this.material)

    const asset = assetManager.get(Assets.Global, 'world-map')

    if (asset instanceof Asset) {
      const texture = asset.data as Texture
      texture.colorSpace = SRGBColorSpace
      this.mesh.material.uniforms.worldMap.value = texture
    }

    for (let i = 0; i < this.attributes.size.count; i++) {
      randomSpherePoint(0, 0, 0, MathUtils.randFloat(this.settings.radius.x, this.settings.radius.y), position)

      this.attributes.position.setXYZ(i, position.x, position.y, position.z)
      this.attributes.phase.setX(i, MathUtils.randFloat(0, 3))
      this.attributes.reveal.setX(i, 0)
      this.attributes.revealOffset.setX(i, MathUtils.randFloat(0.005, 0.1))

      this.attributes.size.setX(i, MathUtils.randFloat(this.settings.particleSize.x, this.settings.particleSize.y))
    }

    this.attributes.size.needsUpdate = true
    this.attributes.phase.needsUpdate = true
    this.attributes.position.needsUpdate = true
    this.attributes.reveal.needsUpdate = true

    this.onColorsChange()

    this.add(this.mesh)
  }

  play = (delay = 0) => {
    this.tween0 = gsap.delayedCall(delay, () => {
      this.isAnimating = true
    })

    this.tween1 = gsap.delayedCall(30, () => {
      this.isAnimating = false
    })
  }

  stop() {
    if (this.tween0) {
      gsap.killTweensOf(this.tween0)
    }

    if (this.tween1) {
      gsap.killTweensOf(this.tween1)
    }

    this.isAnimating = false

    for (let i = 0; i < this.attributes.size.count; i++) {
      this.attributes.reveal.setX(i, 0)
    }

    this.attributes.reveal.needsUpdate = true
  }

  onColorsChange = () => {
    const values = Object.values(this.settings.colors)

    for (let i = 0; i < this.attributes.size.count; i++) {
      color.setStyle(randomItem(values))

      this.attributes.color.setXYZ(i, color.r, color.g, color.b)
    }

    this.attributes.color.needsUpdate = true
  }

  update(camera: PerspectiveCamera) {
    this.mesh.material.uniforms.cameraPosition.value.copy(camera.position)
    this.mesh.material.uniforms.time.value = Time.elapsedTime

    if (this.isAnimating) {
      // Reveal logic
      let value = 0

      for (let i = 0; i < this.attributes.reveal.count; i++) {
        const current = this.attributes.reveal.getX(i)

        if (current < 1) {
          value = Math.min(current + Time.delta * this.attributes.revealOffset.getX(i), 1)

          this.attributes.reveal.setX(i, value)
        }
      }

      this.attributes.reveal.needsUpdate = true
    }
  }
}

/// #if DEBUG
export class GUIParticles extends GUIController {
  constructor(gui: GUIType, target: Particles) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Particles' })

    this.gui
      .addBinding(target.settings, 'totalParticles', {
        min: 1,
        step: 1,
      })
      .on('change', target.generate)

    this.gui
      .addBinding(target.settings, 'particleSize', {
        x: {
          min: 0,
        },
        y: {
          min: 0,
        },
      })
      .on('change', target.generate)

    this.folders.color = this.addFolder(this.gui, { title: 'Colors' })

    Object.keys(target.settings.colors).forEach(key => {
      this.folders.color
        .addBinding(target.settings.colors, key as keyof typeof target.settings.colors)
        .on('change', target.onColorsChange)
    })

    this.controllers.particleShader = new GUIParticleShader(this.gui, target.material)
  }
}
/// #endif
