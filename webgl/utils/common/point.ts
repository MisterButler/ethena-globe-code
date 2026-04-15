import { Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'

const pointGeometry = new SphereGeometry(1, 32, 32)

const materials: {
  [key: number]: MeshBasicMaterial
} = {
  0x00ff00: new MeshBasicMaterial({ color: 0x00ff00 }),
}

export function createPoint(position: Vector3, scale = 1, color = 0x00ff00) {
  if (materials[color] === undefined) {
    materials[color] = new MeshBasicMaterial({ color })
  }
  const mesh = new Mesh(pointGeometry, materials[color])
  mesh.position.copy(position)
  mesh.scale.setScalar(scale)
  return mesh
}
