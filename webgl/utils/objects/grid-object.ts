import { GridHelper } from 'three'

export default class GridObject extends GridHelper {
  name = 'GridObject'

  constructor() {
    super(100, 100)
  }
}
