import { Mesh } from 'three'

import {
  alphaTestBinding,
  anisotropyBinding,
  anisotropyRotationBinding,
  attenuationColorBinding,
  attenuationDistanceBinding,
  autoShaderUniformBinding,
  blendingBinding,
  clearcoatBinding,
  clearcoatRoughnessBinding,
  colorBinding,
  dashScaleBinding,
  depthPackingBinding,
  depthTestBinding,
  depthWriteBinding,
  dispersionBinding,
  ditheringBinding,
  emissiveColorBinding,
  emissiveIntensityBinding,
  envMapIntensityBinding,
  flatShadingBinding,
  fogBinding,
  forceSinglePassBinding,
  gapSizeBinding,
  iorBinding,
  iosThicknessBinding,
  iridescenceBinding,
  iridescenceIORBinding,
  iridescenceThicknessRangeBinding,
  linewidthBinding,
  mapBinding,
  metalnessBinding,
  opacityBinding,
  reflectivityBinding,
  rotationBinding,
  roughnessBinding,
  sheenBinding,
  sheenColorBinding,
  sheenRoughnessBinding,
  shininessBinding,
  sideBinding,
  sizeAttenuationBinding,
  sizeBinding,
  specularColorBinding,
  specularColorBindingPhysical,
  specularIntensityBindingPhysical,
  transmissionBinding,
  transparentBinding,
  vertexColorsBinding,
  visibleBinding,
  wireframeBinding,
} from '../../bindings/gui-material-bindings'
import GUIController from '../gui'
import type { GUIType } from '../gui-types'

export default class GUIMaterialController extends GUIController {
  private shaderBindingDisposer?: () => void

  constructor(gui: GUIType) {
    super(gui)
    this.gui = gui
    if (!(GUIController.state.activeObject instanceof Mesh)) {
      return
    }
    const material = GUIController.state.activeObject.material

    // Handle material arrays
    if (Array.isArray(material)) {
      material.forEach((mat, index) => {
        const materialFolder = this.addFolder(gui, {
          title: `Material ${index}`,
          expanded: false,
        })
        this.createMaterialBindings(materialFolder, mat)
      })
    } else {
      // Handle single material
      this.createMaterialBindings(gui, material)
    }
  }

  private createMaterialBindings(gui: GUIType, material: any) {
    // Basic material info
    gui.addBinding(material, 'type', { readonly: true })
    gui.addBinding(material, 'uuid', { readonly: true })
    gui.addBinding(material, 'name')

    // Create folder for Three.js material properties
    const propertiesFolder = this.addFolder(gui, {
      title: 'Properties',
      expanded: true,
    })

    // Common properties for all materials
    visibleBinding(propertiesFolder, material)
    fogBinding(propertiesFolder, material)
    ditheringBinding(propertiesFolder, material)
    // shadowSideBinding(propertiesFolder, material); // Commented out - not a standard Three.js property

    // Material-specific bindings
    switch (material.type) {
      case 'MeshBasicMaterial':
        colorBinding(propertiesFolder, material)
        reflectivityBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 6)
        mapBinding(propertiesFolder, material, 'specularMap', 7)
        mapBinding(propertiesFolder, material, 'envMap', 8)
        mapBinding(propertiesFolder, material, 'lightMap', 9)
        mapBinding(propertiesFolder, material, 'aoMap', 10)
        sideBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshDepthMaterial':
        vertexColorsBinding(propertiesFolder, material)
        depthPackingBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 5)
        mapBinding(propertiesFolder, material, 'alphaMap', 6)
        mapBinding(propertiesFolder, material, 'displacementMap', 7)
        sideBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshDistanceMaterial':
        mapBinding(propertiesFolder, material, 'map', 3)
        mapBinding(propertiesFolder, material, 'alphaMap', 4)
        mapBinding(propertiesFolder, material, 'displacementMap', 5)
        sideBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        break

      case 'MeshNormalMaterial':
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'bumpMap', 4)
        mapBinding(propertiesFolder, material, 'normalMap', 5)
        mapBinding(propertiesFolder, material, 'displacementMap', 6)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshLambertMaterial':
        colorBinding(propertiesFolder, material)
        emissiveColorBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 7)
        mapBinding(propertiesFolder, material, 'specularMap', 8)
        mapBinding(propertiesFolder, material, 'emissiveMap', 9)
        mapBinding(propertiesFolder, material, 'alphaMap', 10)
        mapBinding(propertiesFolder, material, 'bumpMap', 11)
        mapBinding(propertiesFolder, material, 'normalMap', 12)
        mapBinding(propertiesFolder, material, 'displacementMap', 13)
        mapBinding(propertiesFolder, material, 'envMap', 14)
        mapBinding(propertiesFolder, material, 'lightMap', 15)
        mapBinding(propertiesFolder, material, 'aoMap', 16)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshMatcapMaterial':
        colorBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 5)
        mapBinding(propertiesFolder, material, 'matcap', 6)
        mapBinding(propertiesFolder, material, 'alphaMap', 7)
        mapBinding(propertiesFolder, material, 'bumpMap', 8)
        mapBinding(propertiesFolder, material, 'normalMap', 9)
        mapBinding(propertiesFolder, material, 'displacementMap', 10)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        break

      case 'MeshPhongMaterial':
        colorBinding(propertiesFolder, material)
        specularColorBinding(propertiesFolder, material)
        shininessBinding(propertiesFolder, material)
        emissiveColorBinding(propertiesFolder, material)
        emissiveIntensityBinding(propertiesFolder, material)
        reflectivityBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 10)
        mapBinding(propertiesFolder, material, 'specularMap', 11)
        mapBinding(propertiesFolder, material, 'emissiveMap', 12)
        mapBinding(propertiesFolder, material, 'alphaMap', 13)
        mapBinding(propertiesFolder, material, 'bumpMap', 14)
        mapBinding(propertiesFolder, material, 'normalMap', 15)
        mapBinding(propertiesFolder, material, 'displacementMap', 16)
        mapBinding(propertiesFolder, material, 'envMap', 17)
        mapBinding(propertiesFolder, material, 'lightMap', 18)
        mapBinding(propertiesFolder, material, 'aoMap', 19)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshToonMaterial':
        colorBinding(propertiesFolder, material)
        emissiveColorBinding(propertiesFolder, material)
        emissiveIntensityBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 7)
        mapBinding(propertiesFolder, material, 'emissiveMap', 8)
        mapBinding(propertiesFolder, material, 'alphaMap', 9)
        mapBinding(propertiesFolder, material, 'bumpMap', 10)
        mapBinding(propertiesFolder, material, 'normalMap', 11)
        mapBinding(propertiesFolder, material, 'displacementMap', 12)
        mapBinding(propertiesFolder, material, 'lightMap', 13)
        mapBinding(propertiesFolder, material, 'aoMap', 14)
        mapBinding(propertiesFolder, material, 'gradientMap', 15)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshStandardMaterial':
        colorBinding(propertiesFolder, material)
        emissiveColorBinding(propertiesFolder, material)
        roughnessBinding(propertiesFolder, material)
        metalnessBinding(propertiesFolder, material)
        envMapIntensityBinding(propertiesFolder, material)
        emissiveIntensityBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 8)
        mapBinding(propertiesFolder, material, 'emissiveMap', 9)
        mapBinding(propertiesFolder, material, 'alphaMap', 11)
        mapBinding(propertiesFolder, material, 'bumpMap', 12)
        mapBinding(propertiesFolder, material, 'normalMap', 13)
        mapBinding(propertiesFolder, material, 'displacementMap', 14)
        mapBinding(propertiesFolder, material, 'roughnessMap', 15)
        mapBinding(propertiesFolder, material, 'metalnessMap', 16)
        mapBinding(propertiesFolder, material, 'envMap', 17)
        mapBinding(propertiesFolder, material, 'lightMap', 18)
        mapBinding(propertiesFolder, material, 'aoMap', 19)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'MeshPhysicalMaterial':
        colorBinding(propertiesFolder, material)
        envMapIntensityBinding(propertiesFolder, material)
        emissiveColorBinding(propertiesFolder, material)
        roughnessBinding(propertiesFolder, material)
        metalnessBinding(propertiesFolder, material)
        anisotropyBinding(propertiesFolder, material)
        anisotropyRotationBinding(propertiesFolder, material)
        clearcoatBinding(propertiesFolder, material)
        clearcoatRoughnessBinding(propertiesFolder, material)
        reflectivityBinding(propertiesFolder, material)
        iridescenceBinding(propertiesFolder, material)
        iridescenceIORBinding(propertiesFolder, material)
        iridescenceThicknessRangeBinding(propertiesFolder, material)
        iorBinding(propertiesFolder, material)
        iosThicknessBinding(propertiesFolder, material)
        sheenBinding(propertiesFolder, material)
        sheenRoughnessBinding(propertiesFolder, material)
        sheenColorBinding(propertiesFolder, material)
        specularIntensityBindingPhysical(gui, material)
        specularColorBindingPhysical(gui, material)
        transmissionBinding(propertiesFolder, material)
        attenuationDistanceBinding(propertiesFolder, material)
        attenuationColorBinding(propertiesFolder, material)
        dispersionBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 19)
        mapBinding(propertiesFolder, material, 'emissiveMap', 20)
        emissiveIntensityBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'alphaMap', 22)
        mapBinding(propertiesFolder, material, 'bumpMap', 23)
        mapBinding(propertiesFolder, material, 'normalMap', 24)
        mapBinding(propertiesFolder, material, 'clearcoatNormalMap', 25)
        mapBinding(propertiesFolder, material, 'displacementMap', 26)
        mapBinding(propertiesFolder, material, 'roughnessMap', 27)
        mapBinding(propertiesFolder, material, 'metalnessMap', 28)
        mapBinding(propertiesFolder, material, 'iridescenceMap', 29)
        mapBinding(propertiesFolder, material, 'sheenColorMap', 30)
        mapBinding(propertiesFolder, material, 'sheenRoughnessMap', 31)
        mapBinding(propertiesFolder, material, 'thicknessMap', 32)
        mapBinding(propertiesFolder, material, 'envMap', 33)
        mapBinding(propertiesFolder, material, 'lightMap', 34)
        mapBinding(propertiesFolder, material, 'aoMap', 35)
        mapBinding(propertiesFolder, material, 'transmissionMap', 36)
        sideBinding(propertiesFolder, material)
        flatShadingBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)
        break

      case 'LineBasicMaterial':
        colorBinding(propertiesFolder, material)
        linewidthBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        break

      case 'LineDashedMaterial':
        colorBinding(propertiesFolder, material)
        linewidthBinding(propertiesFolder, material)
        dashScaleBinding(propertiesFolder, material)
        gapSizeBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        break

      case 'PointsMaterial':
        colorBinding(propertiesFolder, material)
        sizeBinding(propertiesFolder, material)
        sizeAttenuationBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 3)
        mapBinding(propertiesFolder, material, 'alphaMap', 4)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        break

      case 'SpriteMaterial':
        colorBinding(propertiesFolder, material)
        rotationBinding(propertiesFolder, material)
        mapBinding(propertiesFolder, material, 'map', 2)
        mapBinding(propertiesFolder, material, 'alphaMap', 3)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        break

      case 'RawShaderMaterial':
      case 'ShaderMaterial': {
        // Standard material properties in Properties folder
        vertexColorsBinding(propertiesFolder, material)
        sideBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        depthWriteBinding(propertiesFolder, material)
        wireframeBinding(propertiesFolder, material)

        // Create separate folder for custom uniforms
        const uniformsFolder = this.addFolder(gui, {
          title: 'Uniforms',
          expanded: true,
        })

        // Automatic uniform bindings in Uniforms folder
        const shaderBinding = autoShaderUniformBinding(uniformsFolder, material)
        if (shaderBinding) {
          this.shaderBindingDisposer = shaderBinding.dispose
        }
        break
      }

      case 'ShadowMaterial':
        colorBinding(propertiesFolder, material)
        vertexColorsBinding(propertiesFolder, material)
        sideBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        forceSinglePassBinding(propertiesFolder, material)
        alphaTestBinding(propertiesFolder, material)
        depthTestBinding(propertiesFolder, material)
        break

      default:
        // For unknown material types, show basic properties
        console.warn(`Unknown material type: ${material.type}`)
        sideBinding(propertiesFolder, material)
        blendingBinding(propertiesFolder, material)
        opacityBinding(propertiesFolder, material)
        transparentBinding(propertiesFolder, material)
        break
    }
  }

  dispose() {
    // Clean up shader uniform bindings
    if (this.shaderBindingDisposer) {
      this.shaderBindingDisposer()
    }

    // Call parent dispose
    super.dispose()
  }
}
