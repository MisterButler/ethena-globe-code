import SceneInspectorCommand from '../../commands/gui-scene-inspector-command'
import sceneChangeMonitor from '../../scene-change-monitor'
import GUIController from '../gui'
import { type GUIType } from '../gui-types'

export default class GUIOutlinerController extends GUIController {
  command: SceneInspectorCommand

  constructor(gui: GUIType) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Outliner', index: 1 })

    this.command = new SceneInspectorCommand(this.gui, this.gui.controller.view.containerElement)

    // Enable scene monitoring since outliner displays the scene graph
    sceneChangeMonitor.monitorScene(GUIController.state.scene)

    // Add keyboard shortcut for search
    this.setupKeyboardShortcuts()

    // this.gui
    //   .addButton({ title: "Log selected object" })
    //   .on("click", this.command.logActiveObject);
  }

  private setupKeyboardShortcuts() {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        this.command.focusSearch()
      }
    }

    document.addEventListener('keydown', handleKeydown)

    // Store reference for cleanup
    ;(this as any).keydownHandler = handleKeydown
  }

  dispose(): void {
    super.dispose()

    // Stop scene monitoring when outliner is disposed
    sceneChangeMonitor.stopMonitoringScene(GUIController.state.scene)

    // Clean up keyboard event listener
    if ((this as any).keydownHandler) {
      document.removeEventListener('keydown', (this as any).keydownHandler)
    }

    this.command.dispose()
  }
}
