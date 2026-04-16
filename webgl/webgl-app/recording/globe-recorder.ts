import { LinearToneMapping, PerspectiveCamera, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

import renderManager from '../rendering/render-manager'
import LandingScene from '../scenes/landing-scene/landing-scene'
import WebGLApp from '../webgl-app'

export type RecordingOptions = {
  width: number
  height: number
  fps: number
  durationSeconds: number
  bitrate: number
  // Matches the dashboard Size slider (1–12). 6 = baseline framing used
  // when the recorder was written; higher = closer camera = bigger globe.
  size: number
  onProgress?: (progress: number) => void
}

const DEFAULT_OPTIONS: RecordingOptions = {
  width: 3840,
  height: 2160,
  fps: 60,
  durationSeconds: 30,
  bitrate: 40_000_000,
  size: 6,
}

export async function recordGlobeRotation(webglApp: WebGLApp, options: Partial<RecordingOptions> = {}) {
  const opts: RecordingOptions = { ...DEFAULT_OPTIONS, ...options }
  const scene = webglApp.sceneManager.scene

  if (!(scene instanceof LandingScene) || !scene.globeScene) {
    throw new Error('Landing scene with globe is not active')
  }

  if (typeof VideoEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder is not supported in this browser')
  }

  const globeScene = scene.globeScene
  const globe = globeScene.globe

  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = opts.width
  offscreenCanvas.height = opts.height

  const offscreenRenderer = new WebGLRenderer({
    canvas: offscreenCanvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  offscreenRenderer.setPixelRatio(1)
  offscreenRenderer.setSize(opts.width, opts.height, false)
  offscreenRenderer.setClearColor(0x000000, 0)
  offscreenRenderer.toneMapping = LinearToneMapping
  offscreenRenderer.toneMappingExposure = 1

  const fov = 40
  const aspect = opts.width / opts.height
  const fillRatio = 0.9
  const globeRadius = 1
  const baseDistance = globeRadius / Math.tan(((fov * fillRatio) / 2) * (Math.PI / 180))
  // 6 is the slider's baseline; scale camera distance inversely with size
  // so a larger slider brings the camera closer (globe appears bigger).
  const distance = baseDistance * (6 / Math.max(opts.size, 0.01))

  const camera = new PerspectiveCamera(fov, aspect, 0.01, 100)
  camera.position.set(0, 0, distance)
  camera.lookAt(0, 0, 0)

  const composer = new EffectComposer(offscreenRenderer)
  composer.setPixelRatio(1)
  composer.setSize(opts.width, opts.height)

  const renderPass = new RenderPass(globeScene.scene, camera)
  const fxaaPass = new ShaderPass(FXAAShader)
  fxaaPass.material.uniforms.resolution.value.x = 1 / opts.width
  fxaaPass.material.uniforms.resolution.value.y = 1 / opts.height

  const srcBloom = renderManager.bloomPass
  const bloomPass = new UnrealBloomPass(
    new Vector2(opts.width, opts.height),
    srcBloom?.strength ?? 0.25,
    srcBloom?.radius ?? 1,
    srcBloom?.threshold ?? 1,
  )
  bloomPass.enabled = srcBloom?.enabled ?? true

  const outputPass = new OutputPass()

  composer.addPass(renderPass)
  composer.addPass(fxaaPass)
  composer.addPass(bloomPass)
  composer.addPass(outputPass)

  const totalFrames = Math.round(opts.fps * opts.durationSeconds)
  const radiansPerFrame = (Math.PI * 2) / totalFrames
  const startRotation = globe.rotation.y
  const wasRendering = webglApp.isRendering

  webglApp.render(false)

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: opts.width,
      height: opts.height,
      frameRate: opts.fps,
    },
    fastStart: 'in-memory',
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error:', e),
  })

  encoder.configure({
    codec: 'avc1.640033',
    width: opts.width,
    height: opts.height,
    bitrate: opts.bitrate,
    framerate: opts.fps,
    avc: { format: 'avc' },
  })

  const microsecondsPerFrame = 1_000_000 / opts.fps

  try {
    for (let i = 0; i < totalFrames; i++) {
      globe.vignette?.update(camera)
      globe.land?.update(camera)
      globe.particles?.update(camera)

      globe.rotation.y = startRotation + radiansPerFrame * i
      globe.updateMatrixWorld(true)

      composer.render()

      const frame = new VideoFrame(offscreenCanvas, {
        timestamp: Math.round(i * microsecondsPerFrame),
        duration: Math.round(microsecondsPerFrame),
      })

      const keyFrame = i % opts.fps === 0
      encoder.encode(frame, { keyFrame })
      frame.close()

      if (encoder.encodeQueueSize > 4) {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (encoder.encodeQueueSize <= 2) resolve()
            else setTimeout(check, 8)
          }
          check()
        })
      }

      opts.onProgress?.((i + 1) / totalFrames)
      await new Promise((r) => setTimeout(r, 0))
    }

    await encoder.flush()
    muxer.finalize()

    const { buffer } = muxer.target as ArrayBufferTarget
    const blob = new Blob([buffer], { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `globe-rotation-${opts.width}x${opts.height}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } finally {
    encoder.close()
    globe.rotation.y = startRotation
    composer.dispose()
    offscreenRenderer.dispose()
    offscreenCanvas.remove()
    if (wasRendering) webglApp.render(true)
  }
}
