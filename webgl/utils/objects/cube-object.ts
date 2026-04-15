import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three'

export default class CubeObject extends Mesh<BoxGeometry, MeshStandardMaterial> {
  name = 'CubeObject'
  constructor() {
    super(new BoxGeometry(1, 1, 1), new MeshStandardMaterial())
    this.castShadow = true
    this.receiveShadow = true
  }
}
