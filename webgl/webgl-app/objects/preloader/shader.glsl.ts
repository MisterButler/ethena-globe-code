export const uniforms = {
  opacity: { value: 0 },
}

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
    void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vec3(1), vUv.y * opacity);
  }
`
