import GUIController from '../editor/gui/gui'
import { GUIType } from '../editor/gui/gui-types'
import NOW from './performance-now'

export default class FrameRateUtil {
  lastUpdate = 0
  elapsed = 0
  interval = 0
  now = 0
  fps = 60
  enabled = true
  unlocked = true

  constructor(fps = 60) {
    this.fps = fps
  }

  update() {
    if (!this.enabled) return true
    if (this.unlocked) return true

    this.now = NOW()

    this.interval = 1000 / this.fps
    this.elapsed = this.now - this.lastUpdate

    if (this.elapsed < this.interval) {
      return false
    }
    this.lastUpdate = this.now - (this.elapsed % this.interval)
    return true
  }
}

/* #if DEBUG */
export class GUIFramerate extends GUIController {
  constructor(gui: GUIType, target: FrameRateUtil) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'FrameRate' })
    this.gui.addBinding(target, 'enabled', { label: 'limit fps?' })
    this.gui.addBinding(target, 'unlocked')
    this.gui.addBinding(target, 'fps', { min: 1, max: 120, step: 1 })
  }
}
/* #endif */
