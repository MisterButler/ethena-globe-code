import { Color } from 'three'
import { ShaderPass } from 'three/examples/jsm/Addons.js'

import GUIController from '../../editor/gui/gui'
import { GUIType } from '../../editor/gui/gui-types'

const TintPass = {
  name: 'TintPass',

  uniforms: {
    tDiffuse: { value: null },
    transition: { value: 1.0 },
    color: { value: new Color(0x000000) },
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform float transition;
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor.rgb = mix(color, texel.rgb, transition);
			gl_FragColor.a = 1.0;

		}`,
}

export { TintPass }

/* #if DEBUG */
export class GUITintPass extends GUIController {
  constructor(gui: GUIType, target: ShaderPass) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'TintPass' })

    this.gui.addBinding(target.material.uniforms.transition, 'value', {
      min: 0,
      max: 1,
      label: 'transition',
    })
  }
}
/* #endif */
