import { mapLinear, worldSpaceReconstruction } from '@/webgl/utils/shaders/math.glsl'
import { Matrix4, Vector2, Vector3 } from 'three'

export const uniforms = {
  cameraNear: { value: 0.01 },
  cameraFar: { value: 500 },
  focusPosition: { value: new Vector3() },
  focusFalloff: { value: new Vector2(5, 6) },
  tDiffuse: { value: null },
  tDepth: { value: null },
  cameraProjectionMatrix: { value: new Matrix4() },
  cameraInverseProjectionMatrix: { value: new Matrix4() },
  viewInverse: { value: new Matrix4() },
}

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  #include <packing>

  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform mat4 cameraProjectionMatrix;
  uniform mat4 cameraInverseProjectionMatrix;
  uniform mat4 viewInverse;
  uniform vec3 focusPosition;
  uniform vec2 focusFalloff;

  ${mapLinear}
  ${worldSpaceReconstruction}

  void main() {
    vec3 diffuse = texture2D(tDiffuse, vUv).rgb;
    float depth = getDepth(vUv);
    float viewZ = getViewZ(depth);
    vec3 worldPosition = getWorldPosition(vUv, depth, viewZ);
    vec3 debugPosition = visualizePosition(worldPosition.rgb);

    // float focusDist = abs(distance(focusPosition, worldPosition.rgb));
    // float dist = clamp(mapLinear(focusDist, focusFalloff.x, focusFalloff.y, 0.0, 1.0), 0.0, 1.0);

    gl_FragColor.rgb = debugPosition;
    gl_FragColor.a = 1.0;
  }
`
