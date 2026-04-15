import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { Color, ShaderMaterial, Vector2, Vector3 } from 'three'
import { Colors } from '../../types/types-webgl'

const shader = {
  uniforms: {
    worldMap: { value: null },
    backgroundColor: { value: new Color(Colors.Background) },
    landColor: { value: new Color(0x0e0f12) },
    seaColor: { value: new Color(0x0c0c0c) },
    rimColor: { value: new Color(0x202939) },
    lightColor: { value: new Color(0x596f9c) },
    remapRange: { value: new Vector2(0, 0.5) },
    powStrength: { value: 0.1 },
    cameraPosition: { value: new Vector3() },
    opacity: { value: 0 },
    lightBrightness: { value: 10.0 },
    lightTransition: { value: 0.0 },
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDirection;

		void main() {
			vUv = uv;

      vNormal = normalize(mat3(modelMatrix) * normal);      // Convert normal to world space
      vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewDirection = normalize(cameraPosition - worldPos);
    
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

  fragmentShader: /* glsl */ `
    uniform vec3 lightColor;
    uniform float lightBrightness;
    uniform float lightTransition;
    uniform vec3 backgroundColor;
    uniform vec3 landColor;
    uniform vec3 seaColor;
    uniform vec3 rimColor;
    uniform vec2 remapRange;
    uniform float powStrength;
    uniform float opacity;
    uniform sampler2D worldMap;
    varying vec3 vNormal;
    varying vec3 vViewDirection;
    varying vec2 vUv;

		void main() {
			vec4 world = texture2D( worldMap, vUv );

      // Main Fresnel
      float fresnelFactor = abs(dot(vViewDirection, normalize(vNormal)));
      fresnelFactor = smoothstep(remapRange.x, remapRange.y, fresnelFactor);
      fresnelFactor = pow(fresnelFactor, powStrength);

            // gl_FragColor = vec4(vec3(world.g) * lightColor, 1.0);

      vec3 landColor2 = mix(landColor, lightColor * mix(0.0, lightBrightness, lightTransition), world.g);

      // texel.rgb = mix(texel.rgb, rimColor,  1.0 - fresnelFactor); // Ensure no dark edges
      vec3 outgoingColor = mix(seaColor, landColor2, world.a); // Ensure no dark edges

      outgoingColor = mix(outgoingColor, rimColor, 1.0 - fresnelFactor); // Apply fresnel effect

      
      gl_FragColor = vec4(mix(backgroundColor, outgoingColor, opacity), 1.0);

      
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
		}`,
}

export default shader

/* #if DEBUG */
export class GUILandShader extends GUIController {
  constructor(gui: GUIType, target: ShaderMaterial) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Land Shader' })

    this.api = {
      landColor: `#${target.uniforms.landColor.value.getHexString()}`,
      seaColor: `#${target.uniforms.seaColor.value.getHexString()}`,
      rimColor: `#${target.uniforms.rimColor.value.getHexString()}`,
      lightColor: `#${target.uniforms.lightColor.value.getHexString()}`,
    }

    // Color control
    this.gui.addBinding(this.api, 'landColor').on('change', () => {
      target.uniforms.landColor.value.setStyle(this.api.landColor)
    })
    this.gui.addBinding(this.api, 'seaColor').on('change', () => {
      target.uniforms.seaColor.value.setStyle(this.api.seaColor)
    })
    this.gui.addBinding(this.api, 'rimColor').on('change', () => {
      target.uniforms.rimColor.value.setStyle(this.api.rimColor)
    })
    this.gui.addBinding(this.api, 'lightColor').on('change', () => {
      target.uniforms.lightColor.value.setStyle(this.api.lightColor)
    })

    this.gui.addBinding(target.uniforms.powStrength, 'value', {
      label: 'powStrength',
      min: 0,
      max: 10,
    })
    this.gui.addBinding(target.uniforms.lightBrightness, 'value', {
      label: 'lightBrightness',
      min: 0,
    })

    this.gui.addBinding(target.uniforms.remapRange, 'value', {
      label: 'remapRange',
      min: 0,
      max: 1,
      x: { min: 0, max: 1 },
      y: { min: 0, max: 1 },
    })
  }
}
/* #endif */
