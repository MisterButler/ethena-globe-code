import {
  CanvasTexture,
  CompressedTexture,
  CubeTexture,
  Data3DTexture,
  DataArrayTexture,
  DataTexture,
  DepthTexture,
  FramebufferTexture,
  Group,
  Line,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshDistanceMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  Object3D,
  Points,
  PointsMaterial,
  RawShaderMaterial,
  ShaderMaterial,
  SkinnedMesh,
  SpriteMaterial,
  Texture,
} from 'three'

type MaterialTypes =
  | MeshBasicMaterial
  | MeshDepthMaterial
  | MeshDistanceMaterial
  | MeshLambertMaterial
  | MeshMatcapMaterial
  | MeshNormalMaterial
  | MeshPhongMaterial
  | MeshPhysicalMaterial
  | MeshStandardMaterial
  | MeshToonMaterial
  | PointsMaterial
  | ShaderMaterial
  | RawShaderMaterial
  | SpriteMaterial

function disposeTextures(material: MaterialTypes) {
  if (material instanceof MeshBasicMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.lightMap)
    disposeTexture(material.aoMap)
    disposeTexture(material.specularMap)
    disposeTexture(material.alphaMap)
    disposeTexture(material.envMap)
  } else if (material instanceof MeshDepthMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.alphaMap)
    disposeTexture(material.displacementMap)
  } else if (material instanceof MeshDistanceMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.alphaMap)
    disposeTexture(material.displacementMap)
  } else if (material instanceof MeshLambertMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.lightMap)
    disposeTexture(material.aoMap)
    disposeTexture(material.emissiveMap)
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
    disposeTexture(material.specularMap)
    disposeTexture(material.alphaMap)
    disposeTexture(material.envMap)
  } else if (material instanceof MeshMatcapMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
    disposeTexture(material.alphaMap)
  } else if (material instanceof MeshNormalMaterial) {
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
  } else if (material instanceof MeshPhongMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.lightMap)
    disposeTexture(material.aoMap)
    disposeTexture(material.emissiveMap)
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
    disposeTexture(material.specularMap)
    disposeTexture(material.alphaMap)
    disposeTexture(material.envMap)
  } else if (material instanceof MeshPhysicalMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.lightMap)
    disposeTexture(material.aoMap)
    disposeTexture(material.emissiveMap)
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
    disposeTexture(material.alphaMap)
    disposeTexture(material.envMap)
    disposeTexture(material.clearcoatMap)
    disposeTexture(material.clearcoatRoughnessMap)
    disposeTexture(material.clearcoatNormalMap)
    disposeTexture(material.iridescenceMap)
    disposeTexture(material.iridescenceThicknessMap)
    disposeTexture(material.sheenColorMap)
    disposeTexture(material.sheenRoughnessMap)
    disposeTexture(material.transmissionMap)
    disposeTexture(material.thicknessMap)
    disposeTexture(material.specularIntensityMap)
    disposeTexture(material.specularColorMap)
  } else if (material instanceof MeshStandardMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.lightMap)
    disposeTexture(material.aoMap)
    disposeTexture(material.emissiveMap)
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
    disposeTexture(material.roughnessMap)
    disposeTexture(material.metalnessMap)
    disposeTexture(material.alphaMap)
    disposeTexture(material.envMap)
  } else if (material instanceof MeshToonMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.lightMap)
    disposeTexture(material.aoMap)
    disposeTexture(material.emissiveMap)
    disposeTexture(material.bumpMap)
    disposeTexture(material.normalMap)
    disposeTexture(material.displacementMap)
    disposeTexture(material.alphaMap)
  } else if (material instanceof PointsMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.alphaMap)
  } else if (material instanceof ShaderMaterial || material instanceof RawShaderMaterial) {
    Object.values(material.uniforms).forEach(uniform => {
      disposeTexture(uniform.value)
    })
  } else if (material instanceof SpriteMaterial) {
    disposeTexture(material.map)
    disposeTexture(material.alphaMap)
  }
}

export function disposeTexture(texture: unknown) {
  if (
    texture instanceof CanvasTexture ||
    texture instanceof CompressedTexture ||
    texture instanceof CubeTexture ||
    texture instanceof Data3DTexture ||
    texture instanceof DataArrayTexture ||
    texture instanceof DataTexture ||
    texture instanceof DepthTexture ||
    texture instanceof FramebufferTexture ||
    texture instanceof Texture ||
    texture instanceof DataTexture
  ) {
    if (texture.image instanceof ImageBitmap) {
      texture.image.close()
    }
    // console.log('disposed', texture);
    texture.dispose()
  }
}

/**
 * Dispose of a threejs scene or object3D
 *
 * @export
 * @param {(Scene | Object3D)} object
 * @param {(Scene | Object3D | null)} parent
 * @return {*}  {void}
 */

const renderables = ['Mesh', 'Points', 'Line', 'LineSegments', 'SkinnedMesh']

export function dispose(object: Mesh | Group | Object3D | SkinnedMesh | Points): void {
  if (object === null || object === undefined) {
    return
  }

  if (renderables.includes(object.type)) {
    const renderable = object as Mesh | SkinnedMesh | Points | Line | LineSegments
    renderable.geometry.dispose()
    if (Array.isArray(renderable.material)) {
      renderable.material.forEach(material => {
        disposeTextures(material as MaterialTypes)
        material.dispose()
      })
    } else {
      disposeTextures(renderable.material as MaterialTypes)
      renderable.material.dispose()
    }
  }

  if (object.children.length > 0) {
    object.children.forEach(child => {
      dispose(child)
    })
  }
}

export function disposeObjects(object: Mesh | Group | Object3D | SkinnedMesh | Points): void {
  if (object === null || object === undefined) {
    return
  }
  dispose(object)
  object.removeFromParent()
}
