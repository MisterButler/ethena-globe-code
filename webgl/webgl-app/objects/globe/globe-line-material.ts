import { Color, ShaderMaterial } from 'three'

import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { computeGradientMask, mapLinear } from '@/webgl/utils/shaders/math.glsl'

// Custom shader material for animated line drawing
export class GlobeLineMaterial extends ShaderMaterial {
  constructor() {
    super({
      depthWrite: false,
      fragmentShader: /* glsl */ `
        uniform vec3 lineColor;
        uniform float glowAnimationProgress;
        uniform float revealAnimationProgress;
        uniform float gradientLength;
        uniform float gradientBrightness;
        uniform vec2 gradientStartEnd;
        uniform float opacity;
        varying float vAnimationPercentage;
        
        ${mapLinear}
        ${computeGradientMask}
  
        void main() {
          float gradientPulseMask = computeGradientMask(glowAnimationProgress, gradientLength, gradientStartEnd, vAnimationPercentage);
          float reveal = computeGradientMask(mix(0.0, 0.5, revealAnimationProgress), 1.0, vec2(0.0, 0.5), vAnimationPercentage);
          gl_FragColor = vec4(mix(lineColor, lineColor * gradientBrightness, gradientPulseMask), reveal);
        }
      `,
      transparent: true,
      uniforms: {
        glowAnimationProgress: { value: 0.0 },
        // Length of the gradient effect
        gradientBrightness: { value: 2.0 },

        gradientLength: { value: 0.1 },

        // Brightness multiplier for the gradient
        gradientStartEnd: { value: [0.0, 0.1] },

        lineColor: { value: new Color(0xbdd1f6) },
        revealAnimationProgress: { value: 0.0 }, // Start and end fade zones
      },
      vertexShader: /* glsl */ `
        attribute float animationPercentage;
        uniform float animationProgress;
        varying float vAnimationPercentage;
        
        void main() {
          vAnimationPercentage = animationPercentage;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    })
  }
}

/* #if DEBUG */
export class GUIGlobeLineMaterial extends GUIController {
  constructor(gui: GUIType, target: GlobeLineMaterial) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Line Material' })

    // Gradient controls
    const gradientFolder = this.addFolder(this.gui, {
      expanded: false,
      title: 'Gradient',
    })

    // Gradient length
    gradientFolder.addBinding(target.uniforms.gradientLength, 'value', {
      label: 'Gradient Length',
      max: 1,
      min: 0,
      step: 0.01,
    })

    // Gradient brightness
    gradientFolder.addBinding(target.uniforms.gradientBrightness, 'value', {
      label: 'Gradient Brightness',
      max: 5,
      min: 0,
      step: 0.1,
    })
  }
}
/* #endif */
