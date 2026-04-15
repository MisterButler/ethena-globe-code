import { Pane } from 'tweakpane'

import { detect } from '../utils/common/detect'
import { observeElementInViewport } from '../utils/dom'
import GUIController from '../utils/editor/gui/gui'

import { recordGlobeRotation, RecordingOptions } from './recording/globe-recorder'
import LandingScene from './scenes/landing-scene/landing-scene'
import settings from './settings'
import { WebGLSceneId } from './types/types-webgl'
import WebGLApp, { GUIWebGLApp } from './webgl-app'

export default class Experience {
  webglApp!: WebGLApp
  isLargeScreen = false
  guiExperience?: GUIExperience

  parentElement: HTMLElement | null = null
  webglAppElement: HTMLElement | null = null

  onElementInViewport = (isVisible: boolean) => {
    if (this.webglApp) {
      this.webglApp.onElementInViewport(isVisible)
    }
  }

  getCanvasSize() {
    // Get dimensions from webgl-container element
    const webglContainer = this.getContainer()

    if (webglContainer) {
      return {
        height: webglContainer.offsetHeight || 800,
        width: webglContainer.offsetWidth || 800,
      }
    }

    // Fallback to default size if container not found
    return { height: 800, width: 800 }
  }

  getContainer() {
    return document.querySelector<HTMLElement>('.webgl-container')
  }

  setupWebGL = () => {
    this.parentElement = document.querySelector<HTMLElement>('#app')

    if (this.parentElement) {
      observeElementInViewport(this.parentElement, this.onElementInViewport)
    }

    if (!this.parentElement) {
      return
    }

    this.webglApp = new WebGLApp(this.parentElement)

    this.parentElement.classList.add('webgl-app')
    let { height, width } = this.getCanvasSize()

    if (settings.fullscreenDev) {
      width = window.innerWidth
      height = window.innerHeight
    }

    if (detect.device.desktop && settings.gui) {
      this.guiExperience = new GUIExperience(this)
    }

    this.webglApp.setScene(WebGLSceneId.Landing)
    this.webglApp.resize(width, height)
    this.webglApp.render(true)

    let resizeTimeout: NodeJS.Timeout

    const onResize = () => {
      clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        let { height, width } = this.getCanvasSize()

        if (settings.fullscreenDev) {
          width = window.innerWidth
          height = window.innerHeight
        }

        this.webglApp.resize(width, height)
      }, 250)
    }

    onResize()
    window.addEventListener('resize', onResize)
  }

  setGlobeVisible(visible: boolean) {
    const scene = this.webglApp?.sceneManager?.scene
    if (scene instanceof LandingScene) {
      scene.setGlobeVisible(visible)
    }
  }

  setBackgroundVisible(visible: boolean) {
    const scene = this.webglApp?.sceneManager?.scene
    if (scene instanceof LandingScene) {
      scene.setBackgroundVisible(visible)
    }
  }

  setGlobeSize(scale: number) {
    const scene = this.webglApp?.sceneManager?.scene
    if (scene instanceof LandingScene) {
      scene.setGlobeSize(scale)
    }
  }

  setGlobeStyle(style: 'default' | 'blue') {
    const scene = this.webglApp?.sceneManager?.scene
    if (scene instanceof LandingScene) {
      scene.setGlobeStyle(style)
    }
  }

  async recordGlobe(options?: Partial<RecordingOptions>) {
    if (!this.webglApp) throw new Error('WebGL app not initialized')
    return recordGlobeRotation(this.webglApp, options)
  }
}

/// #if DEBUG
export class GUIExperience extends GUIController {
  constructor(target: Experience) {
    const rightPanel = new Pane({
      title: 'Globe',
    })

    super(rightPanel)

    const leftPanel = new Pane({
      expanded: false,
      title: 'Editor',
    })

    // @ts-expect-error ignore
    Object.assign(rightPanel.containerElem_.style, {
      position: 'fixed',
      zIndex: '10000',
    }).position = 'fixed'

    // @ts-expect-error ignore
    Object.assign(leftPanel.containerElem_.style, {
      position: 'fixed',
      zIndex: '10000',
    }).position = 'fixed'

    // @ts-expect-error ignore
    leftPanel.containerElem_.classList.add('gui-webgl-left-panel')

    // @ts-expect-error ignore
    leftPanel.containerElem_.classList.add('gui-webgl-scrollbar')

    // @ts-expect-error ignore
    rightPanel.containerElem_.classList.add('gui-webgl-right-panel')

    // @ts-expect-error ignore
    rightPanel.containerElem_.classList.add('gui-webgl-scrollbar')

    this.controllers.webglApp = new GUIWebGLApp(leftPanel, rightPanel, target.webglApp)
  }
}
/// #endif
