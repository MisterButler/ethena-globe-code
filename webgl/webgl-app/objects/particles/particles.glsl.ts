import { ShaderMaterial, Vector2, Vector3 } from 'three'

import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { circle, mapLinear } from '@/webgl/utils/shaders/math.glsl'

const shader = {
  fragmentShader: /* glsl */ `
    ${circle}
    uniform float intensity;
    uniform sampler2D worldMap;
    uniform float powStrength;
    uniform vec3 color;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewDirection;
    varying float vTravelDistance;
    varying float vReveal;
    varying vec3 vColor;

    uniform vec2 remapRange;
    uniform float opacity;

    #include <common>
    ${mapLinear}

    void main() {
      float c = circle(gl_PointCoord.xy, vec2(0.5), 0.25);

      vec3 n = normalize(vNormal); // make sure it's on a unit sphere

      // longitude (theta): [-PI, PI]
      float u = atan(n.z, n.x) / (2.0 * PI) + 0.5;

      // latitude (phi): [-PI/2, PI/2]
      float v = asin(n.y) / PI + 0.5;

      vec2 uv = vec2(1.0 - u, v);
      vec4 texel = texture2D( worldMap, uv);

      float dist = 1.0 - length(gl_PointCoord.xy - vec2(0.5));
      float alpha = clamp(pow(dist, powStrength), 0.0, 1.0);
      // discard particles behind
      float fresnelFactor = dot(vViewDirection, normalize(vPosition));
      fresnelFactor = smoothstep(remapRange.x, remapRange.y, fresnelFactor);

      if (fresnelFactor < 1.0) {
        discard;
      }

      // Fade in and out
      float animationVisibility = 1.0;
      if(vTravelDistance < 0.1) {
        animationVisibility = mapLinear(vTravelDistance, 0.0, 0.1, 0.0, 1.0);
      } else if(vTravelDistance > 0.9) {
        animationVisibility = mapLinear(vTravelDistance, 0.9, 1.0, 1.0, 0.0);
      }

      float outgoingAlpha = alpha * texel.a * animationVisibility * vReveal;
                
      gl_FragColor = vec4(vColor * intensity * texel.g, outgoingAlpha);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
  uniforms: {
    cameraPosition: { value: new Vector3() },
    intensity: { value: 70 },
    lineHeight: { value: 0.01 },

    opacity: { value: 0 },

    // Animation
    particleLifetime: { value: 3.0 },

    particleScale: { value: 0.1 },

    particleSpeed: { value: 0.2 },

    pixelRatio: { value: 1 },

    powStrength: { value: 10 },

    // powStrength: { value: 35 },
    remapRange: { value: new Vector2(0, 0.1) },

    time: { value: 0 },
    worldMap: { value: null },
  },
  vertexShader: /* glsl */ `
    // Size
    attribute vec3 color;
    attribute float size;
    attribute float reveal;
    attribute float animationTime;
    attribute float phase;

    uniform float time;
    uniform float lineHeight;
    uniform float particleLifetime;
    uniform float particleSpeed;
    uniform float pixelRatio;
    uniform float particleScale;

    varying float vTravelDistance;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewDirection;
    varying float vReveal;
    varying vec3 vColor;
    
    ${mapLinear}

    void main() {

      vReveal = reveal;
      float particleTime = time + phase; // Individual particle timing
      float lifecycleProgress = mod(particleTime / particleLifetime, 1.0); // 0-1 over particle lifetime

      // Origin position (sphere surface)
      vec3 originPosition = position;
      
      // Calculate distance traveled based on lifecycle progress
      float effectiveLineHeight = lineHeight;
      
      float travelDistance = 0.0;
      if (lifecycleProgress < 0.95) {
        // Growing phase: 0-95% of lifecycle
        travelDistance = (lifecycleProgress / 0.95) * effectiveLineHeight * particleSpeed;
      } else {
        // Reset phase: 95-100% of lifecycle - snap back to origin
        travelDistance = 0.0;
      }
          
      // Calculate final position along line direction
      vec3 lineDirection = normalize(position);
      vec3 basePosition = originPosition + (lineDirection * travelDistance);
      
      vec3 finalPosition = basePosition;
      vPosition = finalPosition;
      
      vTravelDistance = travelDistance / (effectiveLineHeight * particleSpeed);

      vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
      vNormal = position;

      vec3 worldPos = (modelMatrix * vec4(finalPosition, 1.0)).xyz;
      vViewDirection = normalize(cameraPosition - worldPos);
      vPosition = worldPos;
      vColor = color;

      gl_PointSize = size * particleScale * pixelRatio * (100.0 / length(mvPosition.xyz));
      gl_Position = projectionMatrix * mvPosition;
      
   }
  `,
}

export default shader

/// #if DEBUG
export class GUIParticleShader extends GUIController {
  constructor(
    gui: GUIType,
    public target: ShaderMaterial,
  ) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'ParticleShader' })

    this.gui.addBinding(target.uniforms.opacity, 'value', {
      label: 'opacity',
      max: 1,
      min: 0,
    })

    this.gui.addBinding(target.uniforms.powStrength, 'value', {
      label: 'powStrength',
      min: 0,
    })

    this.gui.addBinding(target.uniforms.particleScale, 'value', {
      label: 'particleScale',
      min: 0,
    })

    this.gui.addBinding(target.uniforms.intensity, 'value', {
      label: 'intensity',
      min: 0,
    })

    this.gui.addBinding(target.uniforms.remapRange, 'value', {
      label: 'remapRange',
      max: 1,
      min: 0,
      x: { max: 1, min: 0 },
      y: { max: 1, min: 0 },
    })

    // Animation
    this.folders.animation = this.addFolder(this.gui, { title: 'Animation' })

    this.folders.animation.addBinding(target.uniforms.lineHeight, 'value', {
      label: 'lineHeight',
      min: 0,
    })

    this.folders.animation.addBinding(target.uniforms.particleLifetime, 'value', {
      label: 'particleLifetime',
      min: 0,
    })
  }
}
/// #endif
