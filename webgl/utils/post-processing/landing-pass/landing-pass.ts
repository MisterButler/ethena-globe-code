import { createRenderTarget } from '@/webgl/utils/rendering/render-target'
import GlobePlane from '@/webgl/webgl-app/objects/globe/globe-plane'
import GlobeScene from '@/webgl/webgl-app/objects/globe/globe-scene'
import {
  HalfFloatType,
  LinearFilter,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'

/**
 * Globe Composite Pass renders the globe scene to a separate render target
 * and composites it onto the main scene based on the globe plane's viewport bounds
 */
export default class LandingPass extends Pass {
  fsQuad: FullScreenQuad
  material: ShaderMaterial
  renderTarget: WebGLRenderTarget

  constructor(
    public renderBufferSize: Vector2,
    public scene: Scene,
    public camera: PerspectiveCamera,
    public globeScene: GlobeScene,
    public globePlane: GlobePlane,
  ) {
    super()

    // Create separate render target for globe with higher precision to avoid banding
    const { x: width, y: height } = renderBufferSize
    this.renderTarget = createRenderTarget(width, height, {
      type: HalfFloatType, // Use 16-bit float instead of 8-bit to prevent banding
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    })

    // Simple shader to composite the globe texture over the main scene
    this.material = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, // Main scene texture
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;

        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
          // gl_FragColor.r = 1.0;
        }
      `,
    })

    this.fsQuad = new FullScreenQuad(this.material)
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, _readBuffer: WebGLRenderTarget, _deltaTime: number) {
    const currentViewport = new Vector4()
    renderer.getViewport(currentViewport)

    // 1. Render globe scene to separate render target
    const originalRenderTarget = renderer.getRenderTarget()
    renderer.setRenderTarget(this.renderTarget)
    renderer.clear()
    renderer.render(this.scene, this.camera)

    // 2. Get viewport bounds from globe plane
    const viewport = this.globePlane.getViewportBounds(
      this.camera, // Use whatever camera makes sense
      renderer,
    )

    renderer.autoClear = false // Disable clearing in post-processing
    renderer.clearDepth()

    // Only render globe if it's visible
    if (this.globeScene.globe.visible) {
      // Create viewport Vector4 for render manager
      const globeViewport = new Vector4(viewport.x, viewport.y, viewport.width, viewport.height)

      renderer.setViewport(globeViewport)
      renderer.setScissor(globeViewport)

      renderer.render(this.globeScene.scene, this.globeScene.camera)
    }

    // 3. Update shader uniforms
    // this.material.uniforms.tDiffuse.value = readBuffer.texture;
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture

    // 4. Composite the results
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
    this.fsQuad.render(renderer)

    renderer.autoClear = true // Restore clearing

    // Restore original render target
    renderer.setRenderTarget(originalRenderTarget)

    renderer.setViewport(currentViewport.x, currentViewport.y, currentViewport.z, currentViewport.w)
    renderer.setScissor(currentViewport.x, currentViewport.y, currentViewport.z, currentViewport.w)
  }

  setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
  }

  dispose() {
    this.renderTarget.dispose()
    this.material.dispose()
    this.fsQuad.dispose()
  }
}
