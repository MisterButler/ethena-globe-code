export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  uniform sampler2D texture0;
  uniform sampler2D texture1;
  uniform float transition;
  varying vec2 vUv;
  void main() {
    vec4 texel0 = texture2D(texture0, vUv);
    vec4 texel1 = texture2D(texture1, vUv);
    gl_FragColor = mix(texel0, texel1, transition);
  }
`
