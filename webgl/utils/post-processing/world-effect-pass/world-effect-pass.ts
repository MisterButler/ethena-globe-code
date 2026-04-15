import {
  DepthFormat,
  DepthTexture,
  FloatType,
  Mesh,
  MeshNormalMaterial,
  NearestFilter,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  UniformsUtils,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'

import GUIController from '../../editor/gui/gui'
import { GUIType } from '../../editor/gui/gui-types'
import * as depthShader from './shader.glsl'

class WorldEffectPass extends Pass {
  fsQuad: FullScreenQuad
  material: ShaderMaterial
  renderTarget: WebGLRenderTarget
  focus = 1
  cameraDirection = new Vector3()
  focusPosition = new Vector3()
  focusTarget: Mesh

  constructor(
    public scene: Scene,
    public camera: PerspectiveCamera,
  ) {
    super()

    this.renderTarget = new WebGLRenderTarget(1, 1)
    this.renderTarget.texture.minFilter = NearestFilter
    this.renderTarget.texture.magFilter = NearestFilter
    this.renderTarget.stencilBuffer = false
    this.renderTarget.depthTexture = new DepthTexture(1, 1)
    this.renderTarget.depthTexture.format = DepthFormat
    this.renderTarget.depthTexture.type = FloatType

    this.material = new ShaderMaterial({
      vertexShader: depthShader.vertexShader,
      fragmentShader: depthShader.fragmentShader,
      uniforms: UniformsUtils.clone(depthShader.uniforms),
    })

    this.fsQuad = new FullScreenQuad(this.material)

    this.focusTarget = new Mesh(
      new SphereGeometry(0.1, 32, 32),
      new MeshNormalMaterial({ depthTest: false, depthWrite: false }),
    )
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget) {
    if (this.clear) renderer.clear()

    // Update position of camera focus target
    this.camera.getWorldDirection(this.cameraDirection)
    this.focusPosition.setScalar(this.focus)

    // this.focusTarget.position.copy(this.camera.position).add(this.cameraDirection.multiply(this.focusPosition));
    this.focusTarget.position.set(0, 0, 0)

    this.material.uniforms.focusPosition.value.copy(this.focusTarget.position)

    this.camera.near = this.material.uniforms.cameraNear.value
    this.camera.far = this.material.uniforms.cameraFar.value
    this.camera.updateProjectionMatrix()

    // Update depth material uniforms
    this.material.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix)
    this.material.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse)
    this.material.uniforms.viewInverse.value.copy(this.camera.matrixWorld)

    // Render depth
    renderer.setRenderTarget(this.renderTarget)
    renderer.render(this.scene, this.camera)
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture
    this.material.uniforms.tDepth.value = this.renderTarget.depthTexture

    // Render effect
    renderer.setRenderTarget(writeBuffer)
    this.fsQuad.material = this.material
    this.fsQuad.render(renderer)
    renderer.setRenderTarget(null)
  }

  setSize(width: number, height: number) {
    super.setSize(width, height)
    this.renderTarget.setSize(width, height)
  }

  dispose() {
    this.material.dispose()
    this.fsQuad.dispose()
  }
}

export { WorldEffectPass }

/* #if DEBUG */
export class GUWorldEffectPass extends GUIController {
  constructor(gui: GUIType, target: WorldEffectPass) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'WorldSpaceEffectPass' })

    // Depth of field
    this.gui.addBinding(target, 'focus', { min: 0, max: 50 })
    this.gui.addBinding(target.material.uniforms.focusFalloff, 'value', {
      min: 0,
      max: 50,
      label: 'focusFalloff',
    })
    this.gui.addBinding(target.material.uniforms.cameraNear, 'value', {
      min: 0,
      max: 50,
      label: 'camera near',
    })
    this.gui.addBinding(target.material.uniforms.cameraFar, 'value', {
      min: 0,
      max: 1000,
      label: 'camera far',
    })
  }
}
/* #endif */
