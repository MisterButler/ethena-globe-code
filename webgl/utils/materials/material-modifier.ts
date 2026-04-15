import { IUniform, UniformsUtils, WebGLProgramParametersWithUniforms } from 'three'

export type Shader = {
  uniforms: { [uniform: string]: IUniform<unknown> }
  vertexShader: string
  fragmentShader: string
}

type ShaderProps = {
  [prop: string]: string
}

export type Hooks = {
  vertex: ShaderProps
  fragment: ShaderProps
}

export type ShaderConfig = {
  hooks?: Hooks
  uniforms?: {
    [prop: string]: IUniform<unknown>
  }
  vertexShader: {
    //
    uniforms: string
    functions: string
    [prop: string]: string
  }
  fragmentShader: {
    //
    uniforms: string
    functions: string
    [prop: string]: string
  }
}

const hooks: Hooks = {
  vertex: {
    projectVertex: 'after:#include <project_vertex>\n',
  },
  fragment: {
    colorFragment: 'after:#include <color_fragment>\n',
    opaqueFragment: 'after:#include <opaque_fragment>\n',
    logdepthbufFragment: 'after:#include <logdepthbuf_fragment>\n',
    transmissionFragment: 'replace:#include <transmission_fragment>\n',
    lights_fragment_maps: 'replace:#include <lights_fragment_maps>',
    roughnessmap_fragment: 'replace:#include <roughnessmap_fragment>',
    metalnessmap_fragment: 'replace:#include <metalnessmap_fragment>',
    color_fragment: 'replace:#include <color_fragment>',
  },
}

function replace(shader: string, hooks: ShaderProps, config: ShaderProps) {
  Object.keys(hooks).forEach((hook: string) => {
    if (config[hook] != null) {
      const parts = hooks[hook].split(':')
      const line = parts[1]
      switch (parts[0]) {
        case 'after': {
          shader = shader.replace(
            line,
            `${line}
            ${config[hook]}`,
          )
          break
        }
        case 'replace': {
          shader = shader.replace(line, config[hook])
          break
        }
        default: {
          // before
          shader = shader.replace(
            line,
            `${config[hook]}
            ${line}`,
          )
          break
        }
      }
    }
  })
  return shader
}

/**
 * Modify threejs built in materials
 *
 * @export
 * @param {Shader} shader
 * @param {ShaderConfig} config
 * @return {*}
 */
export default function materialModifier(shader: WebGLProgramParametersWithUniforms, config: ShaderConfig) {
  if (typeof config.uniforms === 'object') {
    shader.uniforms = UniformsUtils.merge([shader.uniforms, config.uniforms])
  }

  shader.vertexShader = `
    ${config.vertexShader.uniforms || ''}
    ${config.vertexShader.functions || ''}
    ${shader.vertexShader}
  `
  shader.fragmentShader = `
    ${config.fragmentShader.uniforms || ''}
    ${config.fragmentShader.functions || ''}
    ${shader.fragmentShader}
  `

  const vertexHooks = { ...hooks.vertex, ...config.hooks?.vertex }
  const fragmentHooks = { ...hooks.fragment, ...config.hooks?.fragment }

  shader.vertexShader = replace(shader.vertexShader, vertexHooks, config.vertexShader)
  shader.fragmentShader = replace(shader.fragmentShader, fragmentHooks, config.fragmentShader)

  return shader
}
