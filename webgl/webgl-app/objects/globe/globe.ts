import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { Asset } from '@/webgl/utils/loading'
import { WGS84_ELLIPSOID } from '3d-tiles-renderer'
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Group,
  IcosahedronGeometry,
  Line,
  MathUtils,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from 'three'

import assetManager from '../../loading/asset-manager'
import { Assets } from '../../types/types-webgl'
import Land, { GUILand } from '../land/land'
import { GlobeLineMaterial, GUIGlobeLineMaterial } from './globe-line-material'
import Vignette from '../vignette/vignette'
import { GUIVignetteShader } from '../vignette/shader.glsl'
import Particles, { GUIParticles } from '../particles/particles'
import Time from '@/webgl/utils/common/time'
import GlobeAnimatedLines, { GUIGlobeAnimatedLines } from './globe-animated-lines'

const CREATE_ANIMATED_LINES = true
const CREATE_VIGNETTE = true
const CREATE_PARTICLES = true

export default class Globe extends Group {
  name = 'Globe'
  group: Group = new Group()

  vignette!: Vignette
  land!: Land
  particles!: Particles

  animatedLines: Line[] = []
  globeLineMaterial: GlobeLineMaterial
  revealAnimation: GlobeAnimatedLines
  glowAnimation: GlobeAnimatedLines

  constructor(public renderer: WebGLRenderer) {
    super()
    // this.rotation.x = MathUtils.degToRad(25);
    this.group.rotation.x = -Math.PI / 2 // Apply the same rotation as Globe.ts
    this.rotation.y = MathUtils.degToRad(-90)
    this.add(this.group)

    // Initialize animated materials
    this.globeLineMaterial = new GlobeLineMaterial()
    this.revealAnimation = new GlobeAnimatedLines(this.globeLineMaterial, 'revealAnimationProgress')
    this.revealAnimation.settings.loop = false
    this.glowAnimation = new GlobeAnimatedLines(this.globeLineMaterial, 'glowAnimationProgress')
    this.glowAnimation.settings.delay = 5

    const geometry = new IcosahedronGeometry(1, 64)

    this.land = new Land(geometry)
    this.add(this.land)

    if (CREATE_VIGNETTE) {
      this.vignette = new Vignette(geometry)
      this.add(this.vignette)
    }

    if (CREATE_PARTICLES) {
      this.particles = new Particles(this.renderer)
      this.add(this.particles)
    }

    // Load coastline dataset for lines
    const coastlineAsset = assetManager.get(Assets.Global, 'coastline')

    let coastlineData = null

    if (coastlineAsset instanceof Asset) {
      coastlineData = coastlineAsset.data
    }

    this.setup(coastlineData)

    this.play()
  }

  setup(coastlineData: any = null) {
    const resolution = 0.3
    const wireframe = false

    const wireframeGroup = new Group()
    wireframeGroup.visible = wireframe
    this.add(wireframeGroup)

    if (CREATE_ANIMATED_LINES) {
      if (coastlineData && coastlineData.lines) {
        const coastlineGeometries: BufferGeometry[] = []

        coastlineData.lines.forEach((geom: any) => {
          const line = geom.getLineObject({
            ellipsoid: WGS84_ELLIPSOID,
            resolution,
          })

          if (line.geometry) {
            const geometry = line.geometry.clone()

            line.updateMatrixWorld()
            geometry.applyMatrix4(line.matrixWorld)

            coastlineGeometries.push(geometry)

            const animatedLine = this.createAnimatedLine(line.geometry)

            animatedLine.position.copy(line.position)
            animatedLine.rotation.copy(line.rotation)
            animatedLine.scale.copy(line.scale)
            this.animatedLines.push(animatedLine)
            this.group.add(animatedLine)
          }
        })

        // Clean up individual geometries to free memory
        coastlineGeometries.forEach(geometry => geometry.dispose())
      }
    }

    // scale and center the model
    const box = new Box3()
    box.setFromObject(this.group)
    box.getCenter(this.group.position).multiplyScalar(-1)

    const size = new Vector3()
    box.getSize(size)
    this.group.scale.setScalar(1.5 / Math.max(...size))
    this.group.position.multiplyScalar(this.group.scale.x)
    this.group.position.set(0, 0, 0)
  }

  createAnimatedLine(geometry: BufferGeometry): Line {
    // Get the position attribute from the already transformed geometry
    const positionAttribute = geometry.getAttribute('position')
    if (!positionAttribute) {
      throw new Error('Geometry missing position attribute')
    }

    const positions = positionAttribute.array as Float32Array
    const vertexCount = positions.length / 3

    // Calculate total line length to determine lineAnimationSettings percentages
    let totalLength = 0
    const segmentLengths: number[] = []

    for (let i = 1; i < vertexCount; i++) {
      const x1 = positions[(i - 1) * 3]
      const y1 = positions[(i - 1) * 3 + 1]
      const z1 = positions[(i - 1) * 3 + 2]

      const x2 = positions[i * 3]
      const y2 = positions[i * 3 + 1]
      const z2 = positions[i * 3 + 2]

      const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2)

      segmentLengths.push(segmentLength)
      totalLength += segmentLength
    }

    // Create lineAnimationSettings percentage attribute
    const animationPercentages = new Float32Array(vertexCount)
    let currentLength = 0

    animationPercentages[0] = 0 // First vertex starts at 0%

    for (let i = 1; i < vertexCount; i++) {
      currentLength += segmentLengths[i - 1]
      animationPercentages[i] = currentLength / totalLength
    }

    const animatedGeometry = new BufferGeometry()
    animatedGeometry.setAttribute('position', positionAttribute.clone())
    animatedGeometry.setAttribute('animationPercentage', new BufferAttribute(animationPercentages, 1))

    if (geometry.index) {
      animatedGeometry.setIndex(geometry.index.clone())
    }

    return new Line(animatedGeometry, this.globeLineMaterial)
  }

  play = () => {
    this.vignette.play()
    this.land.play()
    this.revealAnimation.play()
    this.glowAnimation.play()
    this.particles.play(3)
  }

  stop = () => {
    this.vignette.stop()
    this.land.stop()
    this.revealAnimation.stop()
    this.glowAnimation.stop()
    this.particles?.stop()
  }

  update(camera: PerspectiveCamera) {
    this.vignette?.update(camera)
    this.land?.update(camera)
    this.particles?.update(camera)
    this.rotation.y += Time.delta * 0.1
  }
}

/* #if DEBUG */
export class GUIGlobe extends GUIController {
  constructor(gui: GUIType, target: Globe) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Globe' })

    if (target.particles) {
      this.controllers.particles = new GUIParticles(this.gui, target.particles)
    }

    if (target.vignette) {
      this.controllers.vignette = new GUIVignetteShader(gui, target.vignette.material)
    }

    if (target.land) {
      this.controllers.land = new GUILand(gui, target.land)
    }

    if (target.animatedLines) {
      this.controllers.lines = new GUIGlobeLineMaterial(gui, target.globeLineMaterial)
    }
    this.controllers.globeRevealAnimation = new GUIGlobeAnimatedLines(gui, target.revealAnimation, 'Reveal Animation')
    this.controllers.globeRevealAnimation = new GUIGlobeAnimatedLines(gui, target.glowAnimation, 'Glow Animation')

    this.folders.animation = this.addFolder(this.gui, { title: 'Animation' })
    this.folders.animation.addButton({ title: 'Play' }).on('click', target.play)
    this.folders.animation.addButton({ title: 'Stop' }).on('click', target.stop)
  }
}
/* #endif */
