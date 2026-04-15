import { EventDispatcher } from 'three'

import { detect } from '../utils/common/detect'
import { setQuery } from '@/webgl/utils/common/query-params'
import GUIController from '@/webgl/utils/editor/gui/gui'
import store from '@/webgl/utils/editor/gui/gui-store'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'

import renderManager from './rendering/render-manager'
import { WebGLSettings, WebGLSettingsSerializable } from './types/types-webgl'

export interface SettingsEvent {
  change: object
}

class Settings extends EventDispatcher<SettingsEvent> implements WebGLSettings {
  baseUrl = ''
  maxResolution = false
  gui = false
  renderPreview = false
  debugCamera = true
  helpers = true
  isDevelopment = process.env.NODE_ENV === 'development'
  skipTransitions = false
  platform: 'desktop' | 'mobile' = detect.device.desktop ? 'desktop' : 'mobile'
  fullscreenDev = false

  constructor() {
    super()
    this.load()
  }

  onChange = () => {
    this.save()
    this.dispatchEvent({ type: 'change' })
  }

  serialize(): WebGLSettingsSerializable {
    return {
      debugCamera: this.debugCamera,
      gui: this.gui,
      helpers: this.helpers,
      isDevelopment: this.isDevelopment,
      maxResolution: this.maxResolution,
      renderPreview: this.renderPreview,
      skipTransitions: this.skipTransitions,
    }
  }

  save() {
    store.set('settings', this.serialize())
  }

  load() {
    const settings = store.get('settings')

    if (settings) {
      Object.assign(this, settings)
    }

    this.skipTransitions = true
    this.gui = false
    this.debugCamera = false
    this.helpers = false
    this.fullscreenDev = false
  }
}

const settings = new Settings()

export default settings

/* #if DEBUG */
export class GUISettingsManager extends GUIController {
  constructor(gui: GUIType, target: Settings) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Settings' })

    // You need to reload the page to enable stats if it's turned off by the default
    this.gui.addBinding(target, 'maxResolution').on('change', () => {
      target.onChange()
      renderManager.resize(window.innerWidth, window.innerHeight)
      setQuery('maxResolution', target.maxResolution.toString(), window)
    })

    this.gui.addBinding(target, 'debugCamera').on('change', target.onChange)
    this.gui.addBinding(target, 'renderPreview').on('change', target.onChange)
    this.gui.addBinding(target, 'helpers').on('change', target.onChange)

    this.gui.addBinding(target, 'skipTransitions').on('change', target.onChange)
  }
}
/* #endif */
