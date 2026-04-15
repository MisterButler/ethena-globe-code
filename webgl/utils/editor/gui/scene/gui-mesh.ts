import { Mesh } from 'three'

import GUIController from '../gui'
import type { GUIType } from '../gui-types'
import GUIGeometryController from './gui-geometry'
import GUIMaterialController from './gui-material'
import GUIObject3DController from './gui-object-3d'

export default class GUIMeshController extends GUIController {
  constructor(gui: GUIType) {
    super(gui)
    this.gui = gui.addFolder({ title: 'Mesh', index: 4 })

    const tabs = this.gui.addTab({
      index: 3,
      pages: [
        //
        { title: 'Object' },
        { title: 'Geometry' },
        { title: 'Material' },
      ],
    })
    this.tabs = tabs

    this.controllers.object3D = new GUIObject3DController(this.tabs.pages[0])

    if (GUIController.state.activeObject instanceof Mesh) {
      this.controllers.geometry = new GUIGeometryController(this.tabs.pages[1])
      this.controllers.material = new GUIMaterialController(this.tabs.pages[2])
    }
  }
}
