import { HemisphereLight, HemisphereLightHelper, Object3D } from 'three'

export default class HemisphereLightObject extends Object3D {
  name = 'HemisphereLightObject'

  constructor() {
    super()

    const light = new HemisphereLight(0xffffff, 0x8d8d8d, 2)
    const helper = new HemisphereLightHelper(light, 1)
    light.name = 'Hemisphere Light'
    helper.name = 'Hemisphere Light Helper'

    this.add(light, helper)
  }
}
