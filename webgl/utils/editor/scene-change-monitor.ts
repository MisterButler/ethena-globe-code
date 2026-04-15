import { Object3D, Scene } from 'three'

import guiEvents, { GUIEditorEvent } from './gui/gui-events'

class SceneChangeMonitor {
  private monitoredScenes = new Set<Scene>()
  private pendingUpdate = false
  private originalAdd = new Map<Scene, (...args: any[]) => any>()
  private originalRemove = new Map<Scene, (...args: any[]) => any>()

  /**
   * Start monitoring a scene for object additions/removals
   */
  monitorScene(scene: Scene) {
    if (this.monitoredScenes.has(scene)) {
      return // Already monitoring this scene
    }

    this.monitoredScenes.add(scene)

    // Store original methods
    const originalAdd = scene.add.bind(scene)
    const originalRemove = scene.remove.bind(scene)

    this.originalAdd.set(scene, originalAdd)
    this.originalRemove.set(scene, originalRemove)

    // Override add method
    scene.add = (...objects: Object3D[]) => {
      const result = originalAdd(...objects)
      this.scheduleUpdate()
      return result
    }

    // Override remove method
    scene.remove = (...objects: Object3D[]) => {
      const result = originalRemove(...objects)
      this.scheduleUpdate()
      return result
    }

    // console.log("🔍 Scene change monitoring enabled for scene:", scene.uuid);
  }

  /**
   * Stop monitoring a scene
   */
  stopMonitoringScene(scene: Scene) {
    if (!this.monitoredScenes.has(scene)) {
      return // Not monitoring this scene
    }

    this.monitoredScenes.delete(scene)

    // Restore original methods
    const originalAdd = this.originalAdd.get(scene)
    const originalRemove = this.originalRemove.get(scene)

    if (originalAdd) {
      scene.add = originalAdd as any
      this.originalAdd.delete(scene)
    }

    if (originalRemove) {
      scene.remove = originalRemove as any
      this.originalRemove.delete(scene)
    }

    // console.log("🔍 Scene change monitoring disabled for scene:", scene.uuid);
  }

  /**
   * Schedule an update to be dispatched on the next frame
   * This ensures we only fire once per frame regardless of how many changes happen
   */
  private scheduleUpdate() {
    if (this.pendingUpdate) {
      return // Update already scheduled
    }

    this.pendingUpdate = true

    // Use requestAnimationFrame to ensure we fire once per frame max
    requestAnimationFrame(() => {
      this.pendingUpdate = false

      // Dispatch the scene graph changed event
      guiEvents.dispatchEvent({
        type: GUIEditorEvent.SceneGraphChanged,
      })

      // console.log("🔄 Scene graph changed event dispatched");
    })
  }

  /**
   * Stop monitoring all scenes and clean up
   */
  dispose() {
    for (const scene of this.monitoredScenes) {
      this.stopMonitoringScene(scene)
    }
    this.monitoredScenes.clear()
    this.originalAdd.clear()
    this.originalRemove.clear()
  }

  /**
   * Get the list of currently monitored scenes
   */
  getMonitoredScenes(): Scene[] {
    return Array.from(this.monitoredScenes)
  }
}

// Create a singleton instance
const sceneChangeMonitor = new SceneChangeMonitor()

export default sceneChangeMonitor
