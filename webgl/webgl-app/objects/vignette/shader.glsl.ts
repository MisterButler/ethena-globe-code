import { Color, ShaderMaterial, Vector2, Vector3 } from 'three'

import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'

const shader = {
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform vec2 remapRange;
    uniform float powStrength;
    uniform float opacity;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
		void main() {

      float fresnelFactor = abs(dot(vViewDirection, normalize(vNormal)));
      fresnelFactor = smoothstep(remapRange.x, remapRange.y, fresnelFactor);
      fresnelFactor = pow(fresnelFactor, powStrength);

			gl_FragColor = vec4(color, clamp(fresnelFactor, 0.0, 1.0) * opacity);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
		}`,
  uniforms: {
    cameraPosition: { value: new Vector3() },
    color: { value: new Color(0x7d92b9) },
    opacity: { value: 0 },
    powStrength: { value: 100 },
    remapRange: { value: new Vector2(0, 1) },
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewDirection;

		void main() {
			vUv = uv;
      vNormal = normalize(mat3(modelMatrix) * normal);      // Convert normal to world space
      vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz; // World-space position
      vViewDirection = normalize(cameraPosition - worldPos);
      
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
}

export default shader

/* #if DEBUG */
export class GUIVignetteShader extends GUIController {
  constructor(gui: GUIType, target: ShaderMaterial) {
    super(gui)

    this.api = {
      color: `#${target.uniforms.color.value.getHexString()}`,
    }

    this.gui = this.addFolder(gui, { title: 'Vignette' })

    this.gui.addBinding(target.uniforms.powStrength, 'value', {
      label: 'powStrength',
      min: 0,
    })

    this.gui.addBinding(target.uniforms.remapRange, 'value', {
      label: 'remapRange',
      max: 1,
      min: 0,
      x: { max: 1, min: 0 },
      y: { max: 1, min: 0 },
    })

    this.gui.addBinding(this.api, 'color').on('change', () => {
      target.uniforms.color.value.setStyle(this.api.color)
    })
  }
}
/* #endif */
