import { DirectionalLight, DirectionalLightHelper, Object3D } from 'three'

export default class DirectionalLightObject extends Object3D {
  name = 'DirectionalLightObject'
  constructor() {
    super()

    const light = new DirectionalLight(0xffffff, 2)
    const helper = new DirectionalLightHelper(light)
    light.name = 'Directional Light'
    helper.name = 'Directional Light Helper'

    light.position.set(1, 1, 1)

    this.add(light, helper)
  }
}
