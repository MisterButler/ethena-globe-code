import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { WebGLScene } from '@/webgl/webgl-app/scenes/base-scene/base-scene'
import { gsap } from 'gsap'
import { ShaderMaterial, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { FolderApi } from 'tweakpane'

import { createRenderTarget } from '../../rendering/render-target'
import { fragmentShader, vertexShader } from './shader.glsl'

/**
 * Transition pass handles transitioning between two scenes
 *
 * @export
 * @class TransitionPass
 * @extends {Pass}
 */
export default class TransitionPass extends Pass {
  fsQuad: FullScreenQuad
  material: ShaderMaterial
  renderTargetA: WebGLRenderTarget
  renderTargetB: WebGLRenderTarget
  sceneA!: WebGLScene
  sceneB!: WebGLScene
  gui!: FolderApi
  debugCamera = false

  constructor(
    renderBufferSize: Vector2,
    public skipTransition = false,
  ) {
    super()

    this.material = new ShaderMaterial({
      uniforms: {
        texture0: {
          value: null,
        },
        texture1: {
          value: null,
        },
        transition: {
          value: 0,
        },
      },
      vertexShader,
      fragmentShader,
    })
    this.fsQuad = new FullScreenQuad(this.material)
    const { x: width, y: height } = renderBufferSize
    this.renderTargetA = createRenderTarget(width, height)
    this.renderTargetB = createRenderTarget(width, height)
  }

  /**
   * Transition activates this pass and blends from sceneA to sceneB
   *
   * @memberof TransitionPass
   */
  async transition() {
    return new Promise(resolve => {
      if (this.skipTransition) {
        this.material.uniforms.transition.value = 1
        resolve(null)
      } else {
        this.material.uniforms.transition.value = 0
        gsap.killTweensOf(this.material.uniforms.transition)
        gsap.to(this.material.uniforms.transition, {
          duration: 1,
          value: 1,
          onComplete: () => resolve(null),
        })
      }
    })
  }

  /**
   * Render scene logic based on the transition value
   *
   * @param {WebGLRenderer} renderer
   * @param {WebGLRenderTarget} writeBuffer
   * @param {number} deltaTime
   * @memberof TransitionPass
   */
  renderScene(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, deltaTime: number) {
    const transition = this.material.uniforms.transition.value
    if (transition > 0 && transition < 1) {
      this.sceneA.update(deltaTime)
      this.sceneB.update(deltaTime)
      renderer.setClearColor(this.sceneA.clearColor)
      renderer.setRenderTarget(this.renderTargetA)
      renderer.render(this.sceneA.scene, this.debugCamera ? this.sceneA.cameras.dev : this.sceneA.cameras.main)
      renderer.setClearColor(this.sceneB.clearColor)
      renderer.setRenderTarget(this.renderTargetB)
      renderer.render(this.sceneB.scene, this.debugCamera ? this.sceneB.cameras.dev : this.sceneB.cameras.main)
      this.material.uniforms.texture0.value = this.renderTargetA.texture
      this.material.uniforms.texture1.value = this.renderTargetB.texture
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
      this.fsQuad.render(renderer)
    } else if (transition === 0) {
      this.sceneA.update(deltaTime)
      renderer.setClearColor(this.sceneA.clearColor)
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
      renderer.render(this.sceneA.scene, this.debugCamera ? this.sceneA.cameras.dev : this.sceneA.cameras.main)
    } else {
      this.sceneB.update(deltaTime)
      renderer.setClearColor(this.sceneB.clearColor)
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
      renderer.render(this.sceneB.scene, this.debugCamera ? this.sceneB.cameras.dev : this.sceneB.cameras.main)
    }
  }

  /**
   * Resize handler
   *
   * @param {number} width
   * @param {number} height
   * @memberof TransitionPass
   */
  setSize(width: number, height: number) {
    this.renderTargetA.setSize(width, height)
    this.renderTargetB.setSize(width, height)
  }

  /**
   * Set the current webgl scene
   *
   * @param {WebGLScene} scene
   * @memberof TransitionPass
   */
  setCurrentScene(scene: WebGLScene) {
    this.setScenes(this.sceneB, scene)
  }

  /**
   * Set the scenes
   *
   * @param {WebGLScene} sceneA
   * @param {WebGLScene} sceneB
   * @memberof TransitionPass
   */
  setScenes(sceneA: WebGLScene, sceneB: WebGLScene) {
    this.sceneA = sceneA
    this.sceneB = sceneB
  }

  /**
   * Render the pass
   *
   * @param {WebGLRenderer} renderer
   * @param {WebGLRenderTarget} writeBuffer
   * @param {WebGLRenderTarget} _readBuffer
   * @param {number} deltaTime
   * @param {boolean} _maskActive
   * @memberof TransitionPass
   */
  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, _readBuffer: WebGLRenderTarget, deltaTime: number) {
    this.renderScene(renderer, writeBuffer, deltaTime)
  }
}

/* #if DEBUG */
export class GUITransitionPass extends GUIController {
  constructor(gui: GUIType, target: TransitionPass) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'TransitionPass' })

    this.gui.addBinding(target.material.uniforms.transition, 'value', {
      min: 0,
      max: 1,
      label: 'transition',
      readonly: true,
    })
  }
}
/* #endif */
