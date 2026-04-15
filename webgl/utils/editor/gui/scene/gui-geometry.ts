import { disposeObjects } from '@/webgl/utils/common/memory'
import { Mesh } from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/Addons.js'

import GUIController from '../gui'
import type { GUIType } from '../gui-types'
import { getGeometryAttributes, getGeometryBounds } from '../gui-utils'

export default class GUIGeometryController extends GUIController {
  vertexNormalsHelper: VertexNormalsHelper | null = null

  constructor(gui: GUIType) {
    super(gui)
    this.gui = gui

    if (GUIController.state.activeObject instanceof Mesh) {
      gui.addBinding(GUIController.state.activeObject.geometry, 'type', {
        readonly: true,
      })
      gui.addBinding(GUIController.state.activeObject.geometry, 'uuid', {
        readonly: true,
      })
      gui.addBinding(GUIController.state.activeObject.geometry, 'name', {
        readonly: true,
      })

      this.api.attributes = getGeometryAttributes(GUIController.state.activeObject.geometry)
      this.api.boundingBox = getGeometryBounds(GUIController.state.activeObject.geometry)
      this.api.showVertexNormals = false
    }

    gui.addBinding(this.api, 'attributes', {
      readonly: true,
      multiline: true,
      rows: this.api.attributes.split('\n').length,
    })

    gui.addBinding(this.api, 'boundingBox', {
      readonly: true,
      multiline: true,
      rows: this.api.boundingBox.split('\n').length,
    })

    gui.addButton({ title: 'Toggle Vertex Normals', label: '' }).on('click', this.toggleVertexNormals)
  }

  toggleVertexNormals = () => {
    this.api.showVertexNormals = !this.api.showVertexNormals
    if (this.api.showVertexNormals) {
      this.vertexNormalsHelper = new VertexNormalsHelper(GUIController.state.activeObject, 0.1, 0x00ff00)
      GUIController.state.scene.add(this.vertexNormalsHelper)
    } else if (this.vertexNormalsHelper) {
      disposeObjects(this.vertexNormalsHelper)
    }
  }
}
