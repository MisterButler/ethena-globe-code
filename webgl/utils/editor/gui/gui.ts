import { BindingApi } from '@tweakpane/core'
import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { EventDispatcher } from 'three'
import type { FolderApi, FolderParams, TabApi, TabPageApi } from 'tweakpane'

import store from './gui-store'
import { GUIType } from './gui-types'
import { OrbitControls } from '../../common/OrbitControls'

class GUIState {
  renderer!: WebGLRenderer
  scene!: Scene
  camera!: PerspectiveCamera
  controls!: OrbitControls
  activeObject!: Object3D
}

export default class GUIController extends EventDispatcher {
  static state = new GUIState()

  gui!: FolderApi | TabPageApi
  folders: { [key: string]: FolderApi } = {}
  bindings: BindingApi[] = []
  guiParent: FolderApi | TabPageApi
  tabs?: TabApi
  controllers: { [key: string]: GUIController } = {}
  api: { [key: string]: any } = {}

  constructor(gui: FolderApi | TabPageApi, _tabs?: TabApi) {
    super()
    this.guiParent = gui
    if (_tabs) this.tabs = _tabs

    if (this.tabs) {
      this.tabs.on('select', event => {
        if (typeof this.guiParent.title === 'string') {
          store.set(this.guiParent.title, event.index)
        }
      })

      if (typeof this.guiParent.title === 'string') {
        const index = store.get(this.guiParent.title)
        if (typeof index === 'number' && this.tabs.pages[index]) {
          this.tabs.pages[index].selected = true
        }
      }
    }
  }

  saveFolderState(folder: GUIType, expanded: boolean) {
    if (folder.title) {
      store.set(`folder-${folder.title}`, expanded ? 'open' : 'closed')
    }
  }

  getFolderState(folder: GUIType) {
    if (folder.title) {
      return store.get(`folder-${folder.title}`)
    }
    return 'closed'
  }

  addFolder(gui: GUIType, params: FolderParams) {
    const folder = gui.addFolder(params)
    folder.on('fold', ({ expanded }) => {
      this.saveFolderState(folder, expanded)
    })
    folder.expanded = this.getFolderState(folder) === 'open'
    return folder
  }

  save() {
    // todo!
  }

  reset() {
    // todo!
  }

  dispose() {
    this.gui?.dispose()
    this.tabs?.dispose()
    Object.values(this.controllers).forEach(controller => controller.dispose())
  }
}
