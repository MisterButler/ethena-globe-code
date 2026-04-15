import GUIViewportCommand from '../../commands/gui-viewport-command'
import GUIController from '../gui'
import guiEvents, { GUIEditorEvent } from '../gui-events'
import { type GUIType } from '../gui-types'

export default class GUIViewportController extends GUIController {
  command: GUIViewportCommand

  constructor(gui: GUIType) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'Viewport', index: 0 })

    this.command = new GUIViewportCommand()
    this.command.container.visible = true

    this.gui.addBinding(this.command, 'edit', { label: 'edit' }).on('change', () => {
      this.command.onEditChange()
      // Show helpers when edit mode is on
      this.command.container.visible = this.command.edit
      guiEvents.dispatchEvent({
        type: GUIEditorEvent.ViewportEditModeChanged,
        edit: this.command.edit,
      })
      this.gui.refresh()
    })
  }

  dispose(): void {
    super.dispose()
    this.command.dispose()
  }
}
