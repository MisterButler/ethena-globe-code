import type { TabPageApi } from 'tweakpane'

import GUIController from '../gui'
import type { Vector3Options } from '../gui-types'
import { save } from '../gui-utils'
import GUIPositionController from './gui-position'
import GUIRotationController from './gui-rotation'
import folderscaleController from './gui-scale'

export type TransformOptions = {
  position?: Vector3Options
  rotation?: Vector3Options
  scale?: Vector3Options
}

export default class GUITransformController extends GUIController {
  constructor(gui: TabPageApi) {
    super(gui)
    // this.gui = gui.addFolder({ title: 'Transform' });
    this.controllers.position = new GUIPositionController(gui)
    this.controllers.scale = new folderscaleController(gui)
    this.controllers.rotation = new GUIRotationController(gui)

    gui.addButton({ label: '', title: 'Reset' }).on('click', this.reset)
    gui.addButton({ label: '', title: 'Save' }).on('click', this.save)
  }

  save = () => {
    save({
      position: this.controllers.position.save(),
      scale: this.controllers.scale.save(),
      rotation: this.controllers.rotation.save(),
    })
  }

  reset = () => {
    this.controllers.position.reset()
    this.controllers.scale.reset()
    this.controllers.rotation.reset()
  }
}
