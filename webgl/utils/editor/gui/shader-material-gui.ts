import { RawShaderMaterial, ShaderMaterial } from 'three'

import { autoShaderUniformBinding } from '../bindings/gui-material-bindings'
import GUIController from './gui'
import type { GUIType } from './gui-types'

/**
 * Convenience function to automatically generate GUI controls for shader material uniforms.
 * This replaces the need to manually create binding classes for each shader material.
 *
 * Usage:
 * ```typescript
 * const guiDisposer = createShaderMaterialGUI(gui, material, "My Shader");
 * ```
 */
export function createShaderMaterialGUI(
  gui: GUIType,
  material: ShaderMaterial | RawShaderMaterial,
  title?: string,
  options: {
    expanded?: boolean
    customBindings?: (gui: GUIType, material: ShaderMaterial | RawShaderMaterial) => void
  } = {},
) {
  const { expanded = true, customBindings } = options

  // Create a folder for this shader material
  const shaderFolder = gui.addFolder({
    title: title || material.name || `${material.type}`,
    expanded,
  })

  // Add basic material info
  shaderFolder.addBinding(material, 'name')
  shaderFolder.addBinding(material, 'type', { readonly: true })

  // Add custom bindings first if provided
  if (customBindings) {
    const customFolder = shaderFolder.addFolder({
      title: 'Custom Controls',
      expanded: true,
    })
    customBindings(customFolder, material)
  }

  // Add automatic uniform bindings
  const uniformBinding = autoShaderUniformBinding(shaderFolder, material)

  // Return disposer function
  return () => {
    uniformBinding?.dispose()
    shaderFolder.dispose?.()
  }
}

/**
 * Enhanced version that extends GUIController for more complex use cases
 */
export class ShaderMaterialGUIController extends GUIController {
  private uniformBindingDisposer?: () => void

  constructor(
    gui: GUIType,
    material: ShaderMaterial | RawShaderMaterial,
    title?: string,
    customBindings?: (gui: GUIType, material: ShaderMaterial | RawShaderMaterial) => void,
  ) {
    super(gui)

    this.gui = this.addFolder(gui, {
      title: title || material.name || `${material.type}`,
      expanded: true,
    })

    // Add basic material info
    this.gui.addBinding(material, 'name')
    this.gui.addBinding(material, 'type', { readonly: true })

    // Add custom bindings first if provided
    if (customBindings) {
      const customFolder = this.addFolder(this.gui, {
        title: 'Custom Controls',
        expanded: true,
      })
      customBindings(customFolder, material)
    }

    // Add automatic uniform bindings
    const uniformBinding = autoShaderUniformBinding(this.gui, material)
    if (uniformBinding) {
      this.uniformBindingDisposer = uniformBinding.dispose
    }
  }

  dispose() {
    if (this.uniformBindingDisposer) {
      this.uniformBindingDisposer()
    }
    super.dispose()
  }
}

/**
 * Type-safe uniform configuration for better auto-generated controls
 */
export interface UniformConfig {
  [key: string]: {
    min?: number
    max?: number
    step?: number
    label?: string
    folder?: string
    type?: 'number' | 'color' | 'vector2' | 'vector3' | 'vector4' | 'boolean' | 'readonly'
  }
}

/**
 * Advanced shader material GUI with custom uniform configuration
 */
export function createAdvancedShaderMaterialGUI(
  gui: GUIType,
  material: ShaderMaterial | RawShaderMaterial,
  config: {
    title?: string
    expanded?: boolean
    uniforms?: UniformConfig
    customBindings?: (gui: GUIType, material: ShaderMaterial | RawShaderMaterial) => void
  } = {},
) {
  const { title, expanded = true, uniforms: uniformConfig, customBindings } = config

  // Create a folder for this shader material
  const shaderFolder = gui.addFolder({
    title: title || material.name || `${material.type}`,
    expanded,
  })

  // Add basic material info
  shaderFolder.addBinding(material, 'name')
  shaderFolder.addBinding(material, 'type', { readonly: true })

  // Add custom bindings first if provided
  if (customBindings) {
    const customFolder = shaderFolder.addFolder({
      title: 'Custom Controls',
      expanded: true,
    })
    customBindings(customFolder, material)
  }

  // If uniform config is provided, use it to create more precise controls
  if (uniformConfig && material.uniforms) {
    const uniformsFolder = shaderFolder.addFolder({
      title: 'Uniforms',
      expanded: true,
    })

    // Group uniforms by folder if specified
    const folderGroups: { [key: string]: GUIType } = {
      default: uniformsFolder,
    }

    Object.entries(uniformConfig).forEach(([key, config]) => {
      if (!(key in material.uniforms)) return

      const uniform = material.uniforms[key]
      const targetFolder = config.folder
        ? (folderGroups[config.folder] ??= uniformsFolder.addFolder({
            title: config.folder,
            expanded: false,
          }))
        : uniformsFolder

      // Create binding based on configured type or infer from uniform
      const label = config.label || key

      if (config.type === 'readonly') {
        targetFolder.addBinding(uniform, 'value', { label, readonly: true })
      } else if (config.type === 'boolean') {
        targetFolder.addBinding(uniform, 'value', { label })
      } else if (config.type === 'color') {
        targetFolder.addBinding(uniform, 'value', {
          label,
          color: { type: 'float' },
        })
      } else if (config.type === 'number' || typeof uniform.value === 'number') {
        targetFolder.addBinding(uniform, 'value', {
          label,
          min: config.min ?? 0,
          max: config.max ?? 1,
          step: config.step ?? 0.01,
        })
      } else {
        // Fall back to auto-detection
        // This would need the createUniformBinding function to be exported
      }
    })
  } else {
    // Fall back to automatic uniform binding
    autoShaderUniformBinding(shaderFolder, material)
  }

  // Return disposer function
  return () => {
    shaderFolder.dispose?.()
  }
}
