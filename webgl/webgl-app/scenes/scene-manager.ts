import { setQuery } from '@/webgl/utils/common/query-params'
import GUIController from '@/webgl/utils/editor/gui/gui'
import guiEvents, { GUIEditorEvent } from '@/webgl/utils/editor/gui/gui-events'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import Asset, { AssetGroup } from '@/webgl/utils/loading/asset'
import { EventDispatcher, WebGLRenderer } from 'three'

import globalAssets from '../assets/global-assets'
import assetManager from '../loading/asset-manager'
import renderManager from '../rendering/render-manager'
import { WebGLSceneId } from '../types/types-webgl'
import { WebGLScene } from './base-scene/base-scene'
import EmptyScene, { GUIEmptyScene } from './empty-scene/empty-scene'
import LandingScene, { GUILandingScene } from './landing-scene/landing-scene'
import PreloaderScene, { GUIPreloaderScene } from './preloader-scene/preloader-scene'
import StorybookScene, { GUIStorybookScene } from './storybook-scene/storybook-scene'

const ASSETS: { [key: string]: Array<AssetGroup> } = {
  [WebGLSceneId.Preloader.toString()]: [globalAssets],
  [WebGLSceneId.Landing.toString()]: [globalAssets],
  [WebGLSceneId.Storybook.toString()]: [globalAssets],
}

export interface SceneManagerEvent {
  sceneChanged: { scene: WebGLScene }
}

export default class SceneManager extends EventDispatcher<SceneManagerEvent> {
  scene!: WebGLScene
  sceneId = WebGLSceneId.Landing
  sceneMap = {
    [WebGLSceneId.Preloader]: WebGLSceneId.Preloader,
    [WebGLSceneId.Landing]: WebGLSceneId.Landing,
    [WebGLSceneId.Storybook]: WebGLSceneId.Storybook,
  }
  scenes: { [key: string]: WebGLScene } = {}

  constructor(public renderer: WebGLRenderer) {
    super()
    this.scene = this.getScene('')
  }

  getScene = (sceneId: string): WebGLScene => {
    if (this.scenes[sceneId]) {
      return this.scenes[sceneId]
    }
    let scene
    switch (sceneId) {
      case WebGLSceneId.Preloader:
        scene = new PreloaderScene(this.renderer)
        break
      case WebGLSceneId.Landing:
        scene = new LandingScene(this.renderer)
        break
      case WebGLSceneId.Storybook:
        scene = new StorybookScene(this.renderer)
        break
      default:
        scene = new EmptyScene(this.renderer, 'current', 0x000000)
        break
    }

    this.scenes[sceneId] = scene

    return scene
  }

  async changeScene(sceneId: string) {
    await new Promise((resolve, reject) => {
      const previousScene = this.scene
      this.sceneId = sceneId as WebGLSceneId

      if (sceneId === WebGLSceneId.Preloader) {
        previousScene.dispose()
        this.setScene(WebGLSceneId.Preloader)
          .then(() => {
            resolve(null)
          })
          .catch(reject)
        return
      }

      const nextScene = () => {
        previousScene.dispose()
        this.setScene(sceneId)
          .then(() => {
            resolve(null)
          })
          .catch(reject)
      }

      this.setScene(WebGLSceneId.Preloader)
        .then(() => {
          Promise.all([this.loadAssetGroup(ASSETS[sceneId] ?? [])])
            .then(nextScene)
            .catch(reject)
        })
        .catch(reject)
    })
  }

  async loadAssetGroup(assetGroups: Array<AssetGroup>) {
    await new Promise((resolve, reject) => {
      const promises = assetGroups.map(assetGroup => {
        return this.loadAssets(assetGroup.id, assetGroup.assets)
      })
      Promise.all(promises)
        .then(() => {
          resolve(null)
        })
        .catch(reject)
    })
  }

  async loadAssets(assetGroupId: string, assets: Array<Asset>) {
    await new Promise((resolve, reject): Promise<void> | void => {
      try {
        if (assets.length > 0) {
          if (assetManager.assets[assetGroupId]) {
            resolve(null)
            return
          }
          assetManager.load(assetGroupId, assets, resolve, reject)
        } else {
          resolve(null)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async setScene(sceneId: string) {
    await new Promise((resolve, reject) => {
      if (this.scene && sceneId === this.scene.id) return

      // Create new scene instance
      const scene = this.getScene(sceneId)
      scene
        .setup()
        .then(() => {
          // Cache the previous scene
          const previousScene = this.scene

          // Callback when the previous scene has animated out
          const nextScene = () => {
            // Set the current scene
            this.scene = scene

            this.dispatchEvent({ type: 'sceneChanged', scene })

            this.scene.resize(renderManager.resolution.x, renderManager.resolution.y)
            this.scene.animateInit()

            // Animate the scene in
            this.scene.animateIn().then(resolve, reject)
            renderManager.setScene(scene)
            if (previousScene) previousScene.dispose()
          }
          // If the previous scene exists, animate out
          if (previousScene) {
            previousScene.animateOut().then(nextScene).catch(reject)
          } else {
            // Otherwise go to the next scene immediately
            nextScene()
          }
        })
        .catch(reject)
    })
  }

  dispose() {
    // TODO: dispose of all scenes
    this.scene.dispose()
  }
}

/* #if DEBUG */
export class GUISceneManager extends GUIController {
  target: SceneManager
  sceneFolder: GUIType

  constructor(gui: GUIType, target: SceneManager) {
    super(gui)
    this.target = target

    this.gui = this.addFolder(gui, { title: 'Scene Manager' })
    this.sceneFolder = this.addFolder(gui, {
      title: this.target.scene.constructor.name,
      index: 4,
    })

    this.gui.addBinding(target, 'sceneId', { options: target.sceneMap }).on('change', () => {
      target.changeScene(target.sceneId)
      setQuery('sceneID', target.sceneId, window, false)
    })

    target.addEventListener('sceneChanged', this.onSceneChanged)
  }

  onSceneChanged = () => {
    this.sceneFolder.dispose()

    this.sceneFolder = this.addFolder(this.gui, {
      title: this.target.scene.constructor.name,
      index: 4,
    })
    this.controllers.scene = this.getSceneGUIController()

    guiEvents.dispatchEvent({
      type: GUIEditorEvent.SceneChanged,
      scene: this.target.scene.scene,
      camera: this.target.scene.cameras.dev,
      controls: this.target.scene.controls.dev,
    })
  }

  getSceneGUIController() {
    switch (this.target.scene.id) {
      case WebGLSceneId.Preloader:
        return new GUIPreloaderScene(this.sceneFolder, this.target.scene as PreloaderScene)
      case WebGLSceneId.Landing:
        return new GUILandingScene(this.sceneFolder, this.target.scene as LandingScene)
      case WebGLSceneId.Storybook:
        return new GUIStorybookScene(this.sceneFolder, this.target.scene as StorybookScene)
      default:
        return new GUIEmptyScene(this.sceneFolder, this.target.scene as EmptyScene)
    }
  }

  dispose(): void {
    super.dispose()
    this.target.removeEventListener('sceneChanged', this.onSceneChanged)
    this.sceneFolder.dispose()
  }
}
/* #endif */
