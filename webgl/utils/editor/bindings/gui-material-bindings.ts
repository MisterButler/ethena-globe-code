import type {
  LineBasicMaterial,
  LineDashedMaterial,
  Material,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  PointsMaterial,
  RawShaderMaterial,
  ShaderMaterial,
  ShadowMaterial,
  SpriteMaterial,
  Texture,
} from 'three'

import GUICanvasMaterialCommand from '../commands/gui-canvas-material-command'
import type { GUIType } from '../gui/gui-types'

export function colorBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  const api = {
    color: `#${material.color.getHexString()}`,
  }

  gui.addBinding(api, 'color').on('change', () => {
    material.color.setStyle(api.color)
  })
}

export function emissiveColorBinding(gui: GUIType, material: MeshLambertMaterial | MeshStandardMaterial) {
  gui.addBinding(material, 'emissive', { color: { type: 'float' } })
}

export function specularColorBinding(gui: GUIType, material: MeshPhongMaterial) {
  gui.addBinding(material, 'specular', { color: { type: 'float' } })
}

export function reflectivityBinding(gui: GUIType, material: MeshBasicMaterial | MeshPhongMaterial) {
  gui.addBinding(material, 'reflectivity', { min: 0, max: 1, step: 0.01 })
}

export function envMapIntensityBinding(gui: GUIType, material: MeshStandardMaterial | MeshPhysicalMaterial) {
  gui.addBinding(material, 'envMapIntensity', { min: 0, max: 10, step: 0.01 })
}

export function vertexColorsBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'vertexColors')
}

export function mapBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | MeshStandardMaterial
    | MeshLambertMaterial
    | MeshPhongMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial,
  mapType: string,
  index: number,
) {
  const map = {
    isVisible: (material as any)[mapType] !== null,
  }
  gui
    .addBinding(map, 'isVisible', {
      label: mapType,
      index,
    })
    .on('change', el => {
      if (el.value && canvasCommand.map) (material as any)[mapType] = canvasCommand.map
      else (material as any)[mapType] = null
      material.needsUpdate = true
    })

  const canvasCommand = new GUICanvasMaterialCommand(gui, index, (material as any)[mapType])
  canvasCommand.onChange(onMapChange)
  function onMapChange(texture: Texture | null) {
    ;(material as any)[mapType] = texture
    material.needsUpdate = true
  }
}

export function flatShadingBinding(
  gui: GUIType,
  material:
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'flatShading')
}

export function sideBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshLambertMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial,
) {
  gui.addBinding(material, 'side', {
    options: { FrontSide: 0, BackSide: 1, DoubleSide: 2 },
  })
}

export function blendingBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'blending', {
    options: {
      NoBlending: 0,
      NormalBlending: 1,
      AdditiveBlending: 2,
      SubtractiveBlending: 3,
      MultiplyBlending: 4,
      CustomBlending: 5,
    },
  })
}

export function opacityBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'opacity', { min: 0, max: 1, step: 0.01 })
}

export function anisotropyBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'anisotropy', { step: 0.01 })
}

export function specularIntensityBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'specularIntensity', { step: 0.01 })
}

export function transparentBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'transparent')
}

export function forceSinglePassBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'forceSinglePass')
}

export function alphaTestBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'alphaTest', { min: 0, max: 1, step: 0.01 })
}

export function depthTestBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | ShadowMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'depthTest')
}

export function depthWriteBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshMatcapMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | MeshPhysicalMaterial
    | MeshStandardMaterial
    | MeshPhongMaterial
    | MeshLambertMaterial,
) {
  gui.addBinding(material, 'depthWrite')
}

export function wireframeBinding(
  gui: GUIType,
  material:
    | MeshBasicMaterial
    | MeshDepthMaterial
    | MeshNormalMaterial
    | MeshStandardMaterial
    | MeshToonMaterial
    | ShaderMaterial
    | RawShaderMaterial
    | MeshLambertMaterial
    | MeshPhysicalMaterial
    | MeshPhongMaterial,
) {
  gui.addBinding(material, 'wireframe')
}

export function depthPackingBinding(gui: GUIType, material: MeshDepthMaterial) {
  gui.addBinding(material, 'depthPacking', {
    options: { BasicDepthPacking: 0, RGBADepthPacking: 1 },
  })
}

export function shininessBinding(gui: GUIType, material: MeshPhongMaterial) {
  gui.addBinding(material, 'shininess', { min: 0, max: 100, step: 0.01 })
}

export function emissiveIntensityBinding(
  gui: GUIType,
  material: MeshPhongMaterial | MeshToonMaterial | MeshStandardMaterial,
) {
  gui.addBinding(material, 'emissiveIntensity', {
    min: 0,
    max: 2000,
    step: 0.01,
  })
}

export function roughnessBinding(gui: GUIType, material: MeshStandardMaterial) {
  gui.addBinding(material, 'roughness', { min: 0, max: 1, step: 0.01 })
}

export function metalnessBinding(gui: GUIType, material: MeshStandardMaterial) {
  gui.addBinding(material, 'metalness', { min: 0, max: 1, step: 0.01 })
}

export function clearcoatBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'clearcoat', { min: 0, max: 1, step: 0.01 })
}

export function clearcoatRoughnessBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'clearcoatRoughness', {
    min: 0,
    max: 1,
    step: 0.01,
  })
}

export function iridescenceBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'iridescence', { min: 0, max: 1, step: 0.01 })
}

export function iorBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'ior', { min: 0, max: 6, step: 0.01 })
}

export function iosThicknessBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'thickness', { min: 0, max: 1, step: 0.01 })
}

export function sheenBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'sheen', { min: 0, max: 1, step: 0.01 })
}

export function sheenRoughnessBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'sheenRoughness', { min: 0, max: 1, step: 0.01 })
}

export function sheenColorBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'sheenColor', { color: { type: 'float' } })
}

export function transmissionBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'transmission', { min: 0, max: 1, step: 0.01 })
}

export function attenuationDistanceBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'attenuationDistance', {
    min: 0,
    max: 10_000,
    step: 0.01,
  })
}

export function attenuationColorBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  gui.addBinding(material, 'attenuationColor', { color: { type: 'float' } })
}

// Add new bindings for missing material types and properties

export function dashScaleBinding(gui: GUIType, material: LineDashedMaterial) {
  gui.addBinding(material, 'dashSize', { min: 0, max: 10, step: 0.01 })
}

export function gapSizeBinding(gui: GUIType, material: LineDashedMaterial) {
  gui.addBinding(material, 'gapSize', { min: 0, max: 10, step: 0.01 })
}

export function linewidthBinding(gui: GUIType, material: LineBasicMaterial | LineDashedMaterial) {
  gui.addBinding(material, 'linewidth', { min: 0, max: 10, step: 0.01 })
}

export function sizeBinding(gui: GUIType, material: PointsMaterial) {
  gui.addBinding(material, 'size', { min: 0, max: 100, step: 0.1 })
}

export function sizeAttenuationBinding(gui: GUIType, material: PointsMaterial) {
  gui.addBinding(material, 'sizeAttenuation')
}

export function rotationBinding(gui: GUIType, material: SpriteMaterial) {
  gui.addBinding(material, 'rotation', {
    min: 0,
    max: Math.PI * 2,
    step: 0.01,
  })
}

// Enhanced MeshPhysicalMaterial bindings for newer Three.js versions
export function anisotropyRotationBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  if ('anisotropyRotation' in material) {
    gui.addBinding(material, 'anisotropyRotation', {
      min: 0,
      max: Math.PI * 2,
      step: 0.01,
    })
  }
}

export function dispersionBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  if ('dispersion' in material) {
    gui.addBinding(material, 'dispersion', { min: 0, max: 1, step: 0.001 })
  }
}

export function iridescenceIORBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  if ('iridescenceIOR' in material) {
    gui.addBinding(material, 'iridescenceIOR', {
      min: 1,
      max: 2.33,
      step: 0.01,
    })
  }
}

export function iridescenceThicknessRangeBinding(gui: GUIType, material: MeshPhysicalMaterial) {
  if ('iridescenceThicknessRange' in material) {
    const api = {
      minThickness: material.iridescenceThicknessRange[0],
      maxThickness: material.iridescenceThicknessRange[1],
    }

    gui.addBinding(api, 'minThickness', { min: 0, max: 1000, step: 1 }).on('change', () => {
      material.iridescenceThicknessRange[0] = api.minThickness
    })

    gui.addBinding(api, 'maxThickness', { min: 0, max: 1000, step: 1 }).on('change', () => {
      material.iridescenceThicknessRange[1] = api.maxThickness
    })
  }
}

// Improved specular bindings for newer MeshPhysicalMaterial
export function specularIntensityBindingPhysical(gui: GUIType, material: MeshPhysicalMaterial) {
  if ('specularIntensity' in material) {
    gui.addBinding(material, 'specularIntensity', {
      min: 0,
      max: 1,
      step: 0.01,
    })
  }
}

export function specularColorBindingPhysical(gui: GUIType, material: MeshPhysicalMaterial) {
  if ('specularColor' in material) {
    gui.addBinding(material, 'specularColor', { color: { type: 'float' } })
  }
}

// Generic material properties that work across many materials
export function visibleBinding(gui: GUIType, material: Material) {
  gui.addBinding(material, 'visible')
}

export function fogBinding(gui: GUIType, material: Material) {
  if ('fog' in material) {
    gui.addBinding(material, 'fog')
  }
}

export function ditheringBinding(gui: GUIType, material: Material) {
  if ('dithering' in material) {
    gui.addBinding(material, 'dithering')
  }
}

export function shadowSideBinding(gui: GUIType, material: Material) {
  // shadowSide is not a standard Three.js material property
  // Only bind if it actually exists and is accessible
  if (Object.prototype.hasOwnProperty.call(material, 'shadowSide') || 'shadowSide' in material) {
    try {
      const shadowSideOptions = {
        FrontSide: 0,
        BackSide: 1,
        DoubleSide: 2,
      }

      // Create a proxy object to safely handle the binding
      const api = {
        shadowSide: (material as any).shadowSide ?? 0,
      }

      gui
        .addBinding(api, 'shadowSide', {
          label: 'Shadow Side',
          options: shadowSideOptions,
        })
        .on('change', () => {
          ;(material as any).shadowSide = api.shadowSide
        })
    } catch (error) {
      console.warn(`Failed to bind shadowSide for material ${material.type}:`, error)
    }
  }
}

// Automatic shader uniform binding system
export function autoShaderUniformBinding(gui: GUIType, material: ShaderMaterial | RawShaderMaterial) {
  if (!material.uniforms) return

  // Track generated bindings for cleanup
  const generatedBindings: any[] = []

  // Simply bind to all existing uniforms at the time of GUI creation
  // This works with your workflow where onBeforeCompile happens before GUI creation
  Object.entries(material.uniforms).forEach(([key, uniform]) => {
    try {
      const binding = createUniformBinding(gui, key, uniform)
      if (binding) {
        generatedBindings.push(binding)
      }
    } catch (error) {
      console.warn(`Failed to create binding for uniform ${key}:`, error)
    }
  })

  return {
    dispose: () => {
      generatedBindings.forEach(binding => binding.dispose?.())
    },
  }
}

function createUniformBinding(gui: GUIType, name: string, uniform: any) {
  const value = uniform.value

  if (value === null || value === undefined) {
    return null
  }

  // Handle different uniform types
  if (typeof value === 'number') {
    return createNumberBinding(gui, name, uniform)
  } else if (typeof value === 'boolean') {
    return gui.addBinding(uniform, 'value', { label: name })
  } else if (value.isVector2) {
    return createVector2Binding(gui, name, uniform)
  } else if (value.isVector3) {
    return createVector3Binding(gui, name, uniform)
  } else if (value.isVector4) {
    return createVector4Binding(gui, name, uniform)
  } else if (value.isColor) {
    return gui.addBinding(uniform, 'value', {
      label: name,
      color: { type: 'float' },
    })
  } else if (value.isMatrix3 || value.isMatrix4) {
    // Matrices are typically not user-editable
    return gui.addBinding(uniform, 'value', {
      label: name,
      readonly: true,
    })
  } else if (value.isTexture) {
    // For textures, we could add texture slot info
    return gui.addBinding({ info: value.name || 'Texture' }, 'info', {
      label: name,
      readonly: true,
    })
  }

  return null
}

function createNumberBinding(gui: GUIType, name: string, uniform: any) {
  const value = uniform.value

  // Simple range inference - keep it clean and predictable
  const min = 0
  let max = 1
  let step = 0.01

  const lowerName = name.toLowerCase()

  // Only a few special cases for common patterns
  if (lowerName.includes('threshold')) {
    max = 1
    step = 0.001 // Fine control for thresholds
  } else if (lowerName.includes('scale') || lowerName.includes('size')) {
    max = 10
    step = 0.1
  } else if (lowerName.includes('distance')) {
    max = 100
    step = 1
  } else {
    // Default: use current value to set a reasonable max
    if (value > 1) {
      max = Math.max(value * 2, 10)
      step = max > 10 ? 0.1 : 0.01
    }
  }

  return gui.addBinding(uniform, 'value', {
    label: name,
    min,
    max,
    step,
  })
}

function createVector2Binding(gui: GUIType, name: string, uniform: any) {
  const folder = gui.addFolder({ title: name, expanded: false })

  folder.addBinding(uniform.value, 'x', { min: -10, max: 10, step: 0.01 })
  folder.addBinding(uniform.value, 'y', { min: -10, max: 10, step: 0.01 })

  return {
    dispose: () => folder.dispose?.(),
  }
}

function createVector3Binding(gui: GUIType, name: string, uniform: any) {
  const folder = gui.addFolder({ title: name, expanded: false })

  // Check if it might be a color (common for Vector3 uniforms)
  const lowerName = name.toLowerCase()
  if (lowerName.includes('color') || lowerName.includes('tint')) {
    folder.addBinding(uniform, 'value', {
      color: { type: 'float' },
      label: 'Color',
    })
  } else {
    folder.addBinding(uniform.value, 'x', { min: -10, max: 10, step: 0.01 })
    folder.addBinding(uniform.value, 'y', { min: -10, max: 10, step: 0.01 })
    folder.addBinding(uniform.value, 'z', { min: -10, max: 10, step: 0.01 })
  }

  return {
    dispose: () => folder.dispose?.(),
  }
}

function createVector4Binding(gui: GUIType, name: string, uniform: any) {
  const folder = gui.addFolder({ title: name, expanded: false })

  folder.addBinding(uniform.value, 'x', { min: -10, max: 10, step: 0.01 })
  folder.addBinding(uniform.value, 'y', { min: -10, max: 10, step: 0.01 })
  folder.addBinding(uniform.value, 'z', { min: -10, max: 10, step: 0.01 })
  folder.addBinding(uniform.value, 'w', { min: -10, max: 10, step: 0.01 })

  return {
    dispose: () => folder.dispose?.(),
  }
}
