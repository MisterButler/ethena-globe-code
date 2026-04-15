import { copyToClipboard } from '@/webgl/utils/common/basic-functions'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { generateBindingOptions } from '@/webgl/utils/editor/gui/gui-utils'
import { EventDispatcher } from 'three'

import { Quality, SceneState } from './types/types-webgl'

export type AppStateOptions = Partial<AppState>

export interface AppStateEvent {
  change: { state: AppState; prev: AppState }
}

export class AppState {
  route: string = ''
  sceneState: string = SceneState.TransitionIn
  ready: boolean = false
  quality: string = Quality.High

  constructor(state: AppStateOptions = {}) {
    this.set(state)
  }

  set(state: AppStateOptions) {
    Object.assign(this, state)
  }

  equals(state: AppState) {
    return Object.is(this, state)
  }

  clone() {
    return new AppState({ ...this })
  }
}

class AppStateManager extends EventDispatcher<AppStateEvent> {
  state = new AppState()
  prev = new AppState()

  setState(options: AppStateOptions) {
    this.prev = this.state.clone()
    this.state.set(options)

    if (!this.state.equals(this.prev)) {
      this.dispatchEvent({
        type: 'change',
        state: this.state,
        prev: this.prev,
      })
    }
  }

  trigger(callback: (event: AppStateEvent['change']) => void) {
    callback({ state: this.state, prev: this.prev })
  }
}

const stateManager = new AppStateManager()

export { stateManager }

/* #if DEBUG */
export class GUIAppStateManager extends GUIController {
  target: AppStateManager
  questionsAdded = false

  constructor(gui: GUIType, target: AppStateManager) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'AppStateManager' })

    this.target = target
    this.api.state = stateManager.state.clone()

    this.gui
      .addBinding(this.api.state, 'sceneState', {
        options: generateBindingOptions(Object.values(SceneState)),
      })
      .on('change', () => {
        target.setState({
          sceneState: this.api.state.sceneState,
        })
      })
  }

  export = () => {
    copyToClipboard(JSON.stringify(this.target.state, null, 2))
  }
}
/* #endif */
