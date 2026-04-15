import type { Scene } from 'three'
import { PerspectiveCamera } from 'three'

import { backgroundBinding, fogBinding, materialOverrideBinding } from '../../bindings/gui-scene-bindings'
import GUIController from '../gui'
import guiEvents, { GUIEditorEvent, GUIEvent } from '../gui-events'
import type { GUIType } from '../gui-types'
import GUIMeshController from './gui-mesh'
import GUIOutlinerController from './gui-outliner'
import GUIViewportController from './gui-viewport'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls'

export default class GUISceneController extends GUIController {
  constructor(gui: GUIType) {
    super(gui)

    guiEvents.addEventListener(GUIEditorEvent.ObjectSelected, this.onObjectSelected)
    guiEvents.addEventListener(GUIEditorEvent.SceneChanged, this.onSceneChange)
    guiEvents.addEventListener(GUIEditorEvent.SceneGraphChanged, this.onSceneGraphChange)

    this.onSceneChange({
      scene: GUIController.state.scene,
      camera: GUIController.state.camera,
      controls: GUIController.state.controls,
    })
    this.onObjectSelected({
      object: GUIController.state.activeObject,
    })
  }

  onSceneChange = (event: GUIEvent[GUIEditorEvent.SceneChanged]) => {
    this.gui?.dispose()
    this.gui = this.addFolder(this.guiParent, { title: 'Scene', index: 1 })

    GUIController.state.scene = event.scene

    // When a scene is changed we need to update the active object
    GUIController.state.activeObject = event.scene
    this.onObjectSelected({
      object: GUIController.state.activeObject,
    })

    if (event.camera instanceof PerspectiveCamera) {
      GUIController.state.camera = event.camera
    }

    if (event.controls instanceof OrbitControls) {
      GUIController.state.controls = event.controls
    }

    if (GUIController.state.scene.type === 'Scene') {
      materialOverrideBinding(this.gui, GUIController.state.scene as Scene, this)
      fogBinding(this.gui, GUIController.state.scene as Scene, this)
      backgroundBinding(this.gui, GUIController.state.scene as Scene, this)
      this.gui.addBinding(GUIController.state.scene, 'environmentRotation')
    }

    this.onSceneGraphChange()

    this.controllers.viewport?.dispose()
    this.controllers.viewport = new GUIViewportController(this.guiParent)
  }

  onSceneGraphChange = () => {
    this.controllers.outliner?.dispose()
    this.controllers.outliner = new GUIOutlinerController(this.guiParent)
  }

  onObjectSelected = (event: GUIEvent[GUIEditorEvent.ObjectSelected]) => {
    GUIController.state.activeObject = event.object
    this.controllers.mesh?.dispose()
    this.controllers.mesh = new GUIMeshController(this.guiParent)
  }

  dispose() {
    super.dispose()
    guiEvents.removeEventListener(GUIEditorEvent.ObjectSelected, this.onObjectSelected)
    guiEvents.removeEventListener(GUIEditorEvent.SceneChanged, this.onSceneChange)
  }
}
