export const mapLinear = /* glsl */ `
  float mapLinear(float value, float in_min, float in_max, float out_min, float out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }
`

export const mapLinearClamp = /* glsl */ `
  float mapLinearClamp(float value, float in_min, float in_max, float out_min, float out_max) {
    return clamp(mapLinear(value, in_min, in_max, out_min, out_max), out_min, out_max);
  }
`

export const pingPong = /* glsl */ `
  float pingPong(float value) {
    return sin(value) * 0.5 + 0.5;
  }
`

export const worldSpaceReconstruction = /* glsl */ `

  // Snippets taken from SSAOShader.js
  float getDepth( const in vec2 screenPosition ) {
    return texture2D( tDepth, screenPosition ).x;
  }

  float getViewZ( const in float depth ) {
    return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
  }

  vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
    float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];

    vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );

    clipPosition *= clipW; // unprojection.

    return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
  }

  vec3 getWorldPosition(const in vec2 screenPosition, const in float depth, const in float viewZ) {
    return (viewInverse * vec4(getViewPosition(screenPosition, depth, viewZ), 1.0)).xyz;
  }

  vec3 visualizePosition(in vec3 pos){
    float grid = 5.0;
    float width = 3.0;

    pos *= grid;

    // Detect borders with using derivatives.
    vec3 fw = fwidth(pos);
    vec3 bc = clamp((width - abs(1.0 - 2.0 * fract(pos)) / fw), 0.0, 1.0);

    // Frequency filter
    vec3 f1 = smoothstep(1.0 / grid, 2.0 / grid, fw);
    vec3 f2 = smoothstep(2.0 / grid, 4.0 / grid, fw);

    bc = mix(mix(bc, vec3(0.5), f1), vec3(0.0), f2);

    return bc;
  }
`

export const circle = /* glsl */ `
  // Signed distance function for 2D circle
  float circle(vec2 uv, vec2 pos, float rad) {
    float d = length(pos - uv) - rad;
    return step(d, 0.0);
  }
`

export const smoothCircle = /* glsl */ `
  float smoothCircle(const in vec2 screenPosition, const in vec2 maskCenter, const in float maskRadius, const in float maskBorder) {
    vec2 uvMask = screenPosition;
    uvMask -= maskCenter;
    return smoothstep(maskRadius, maskRadius - maskBorder, sqrt(dot(uvMask, uvMask)));
  }
`

export const blendOverlay = /* glsl */ `
  vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
  }
`

export const computeGradientMask = /* glsl */ `

  // Reusable function for calculating gradient-based masking
  float computeGradientMask(float animation, float len, vec2 startEnd, float uvX) {
    float t = mapLinear(animation, 0.0, 1.0, -len, 1.0 + len);
    float tStart = clamp(t - len, 0.0, 1.0);
    float tEnd = clamp(t + len, 0.0, 1.0);

    float x = mapLinear(uvX, tStart, animation, 0.0, 1.0);
    float y = mapLinear(uvX, animation, tEnd, 1.0, 0.0);
    float visibleBand = clamp(x * y, 0.0, 1.0);

    float start = mapLinear(uvX, startEnd.x, startEnd.y, 0.0, 1.0);
    float end = mapLinear(uvX, 1.0 - startEnd.x, 1.0 - startEnd.y, 0.0, 1.0);
    
    return visibleBand * start * end;
  }
`
