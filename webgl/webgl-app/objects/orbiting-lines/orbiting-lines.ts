import gsap from 'gsap'
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  Mesh,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from 'three'

const CITIES: [number, number][] = [
  [40.71, -74.01],
  [51.51, -0.13],
  [48.86, 2.35],
  [35.68, 139.69],
  [22.32, 114.17],
  [1.35, 103.82],
  [-33.87, 151.21],
  [55.76, 37.62],
  [19.43, -99.13],
  [-23.55, -46.63],
  [37.57, 126.98],
  [28.61, 77.21],
  [25.2, 55.27],
  [39.9, 116.4],
  [-1.29, 36.82],
  [41.01, 28.98],
  [13.76, 100.5],
  [52.52, 13.41],
  [34.05, -118.24],
  [43.65, -79.38],
]

function latLonToSphere(lat: number, lon: number): Vector3 {
  const latR = (lat * Math.PI) / 180
  const lonR = (lon * Math.PI) / 180
  return new Vector3(
    Math.cos(latR) * Math.cos(lonR),
    Math.cos(latR) * Math.sin(lonR),
    Math.sin(latR),
  )
}

function randomCityPair(): [Vector3, Vector3] {
  const a = Math.floor(Math.random() * CITIES.length)
  let b = Math.floor(Math.random() * (CITIES.length - 1))
  if (b >= a) b++
  return [latLonToSphere(CITIES[a][0], CITIES[a][1]), latLonToSphere(CITIES[b][0], CITIES[b][1])]
}

function createArcGeometry(from: Vector3, to: Vector3): TubeGeometry {
  const points: Vector3[] = []
  for (let i = 0; i <= 48; i++) {
    const t = i / 48
    const p = new Vector3().copy(from).lerp(to, t).normalize()
    p.multiplyScalar(0.76 + 0.12 * Math.sin(Math.PI * t))
    points.push(p)
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 48, 0.0015, 4, false)
}

const ARC_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ARC_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 lineColor;
  uniform float progress;
  uniform float opacity;
  uniform float tailLength;
  varying vec2 vUv;
  void main() {
    float t = vUv.x;
    float head = progress;
    float tail = max(0.0, head - tailLength);
    if (t > head || t < tail) discard;
    float dist = (t - tail) / tailLength;
    float alpha = smoothstep(0.0, 0.15, dist) * opacity;
    float headGlow = smoothstep(0.6, 1.0, dist) * 0.8;
    gl_FragColor = vec4(lineColor * (1.0 + headGlow), alpha);
  }
`

class ArcLine {
  material: ShaderMaterial
  mesh: Mesh<TubeGeometry, ShaderMaterial>
  private timeline: gsap.core.Timeline | null = null

  constructor(group: Group, color: Color) {
    this.material = new ShaderMaterial({
      uniforms: {
        lineColor: { value: color },
        progress: { value: 0 },
        opacity: { value: 0 },
        tailLength: { value: 0.4 },
      },
      vertexShader: ARC_VERTEX_SHADER,
      fragmentShader: ARC_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const [from, to] = randomCityPair()
    this.mesh = new Mesh(createArcGeometry(from, to), this.material)
    group.add(this.mesh)
  }

  animate() {
    const [from, to] = randomCityPair()
    this.mesh.geometry.dispose()
    this.mesh.geometry = createArcGeometry(from, to)
    const u = this.material.uniforms
    u.progress.value = 0
    u.opacity.value = 0
    this.timeline = gsap.timeline({
      delay: Math.random() * 3,
      onComplete: () => this.animate(),
    })
    this.timeline.to(u.opacity, { value: 1, duration: 0.3 })
    this.timeline.to(u.progress, { value: 1.4, duration: 2.5, ease: 'power1.inOut' }, '<')
    this.timeline.to(u.opacity, { value: 0, duration: 0.3 }, '-=0.3')
  }

  stop() {
    if (this.timeline) {
      this.timeline.kill()
      this.timeline = null
    }
    this.material.uniforms.opacity.value = 0
    this.material.uniforms.progress.value = 0
  }
}

export default class OrbitingLines extends Group {
  name = 'OrbitingLines'
  arcs: ArcLine[] = []

  constructor(count = 10) {
    super()
    // new-globe attaches to a group rotated -PI/2 on X so lat/lon coords line up.
    this.rotation.x = -Math.PI / 2
    const color = new Color(0xd9e5ff)
    for (let i = 0; i < count; i++) {
      this.arcs.push(new ArcLine(this, color))
    }
  }

  play() {
    this.arcs.forEach(a => a.animate())
  }

  stop() {
    this.arcs.forEach(a => a.stop())
  }
}
