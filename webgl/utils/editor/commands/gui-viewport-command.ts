import { Box3, Box3Helper, Group, Object3D, Raycaster, Scene, Vector2 } from 'three'
import { TransformControls, TransformControlsEventMap } from 'three/examples/jsm/controls/TransformControls.js'

import TouchControls, { TouchControlsEvent } from '../../interaction/touch-controls'
import GUIController from '../gui/gui'
import guiEvents, { GUIEditorEvent, GUIEvent } from '../gui/gui-events'

export default class GUIViewportCommand {
  name = 'GUIViewportCommand'

  container = new Group()

  touchControls: TouchControls
  transformControls: TransformControls
  transformGizmo: Object3D // The visual gizmo for transform controls
  timeoutID!: ReturnType<typeof setTimeout>

  edit = false
  raycaster = new Raycaster()
  pointer = new Vector2()
  box3 = new Box3()
  selectionBox = new Box3Helper(this.box3, 0xffff00)
  currentObjectSelected!: Object3D | undefined
  transformControlsMoving = false

  nonEditibleObjectTypes = ['Scene', 'GridHelper']
  nonEditibleObjectNames = [this.name]

  constructor() {
    this.container.name = this.name
    this.touchControls = new TouchControls(GUIController.state.renderer.domElement)
    this.transformControls = new TransformControls(GUIController.state.camera, GUIController.state.renderer.domElement)

    // Get the visual gizmo helper and add it to the scene
    this.transformGizmo = this.transformControls.getHelper()
    this.transformGizmo.userData.isHelper = true // Mark as helper for filtering
    GUIController.state.scene.add(this.transformGizmo)

    // Always listen for dragging changes to disable camera controls
    // This is essential for proper gizmo interaction
    this.transformControls.addEventListener('dragging-changed', this.onTransformControlsDraggingChanged)

    this.selectionBox.visible = false

    this.container.add(this.selectionBox)
    GUIController.state.scene.add(this.container)

    this.onObjectEditModeChange(undefined, this.edit)
  }

  bindEvents(bind: boolean) {
    if (bind) {
      this.transformControls.addEventListener('change', this.onTransformControlsChanged)
      guiEvents.addEventListener(GUIEditorEvent.ObjectSelected, this.onSceneGraphObjectSelected)
      window.addEventListener('keydown', this.onKeyPress)
    } else {
      this.transformControls.removeEventListener('change', this.onTransformControlsChanged)
      guiEvents.removeEventListener(GUIEditorEvent.ObjectSelected, this.onSceneGraphObjectSelected)
      window.removeEventListener('keydown', this.onKeyPress)
    }
  }

  // Toggle edit mode functionality for objects in the scene
  onEditChange = () => {
    this.bindEvents(this.edit)
    this.onObjectEditModeChange(this.currentObjectSelected, this.edit)
  }

  // Disable orbit controls while the transform controls are being used
  onTransformControlsDraggingChanged = (event: TransformControlsEventMap['dragging-changed']) => {
    if (!GUIController.state.controls) {
      return
    }

    // Disable/enable orbit controls based on transform dragging state
    GUIController.state.controls.enabled = !event.value
  }

  // Update the selection box and helpers when objects are moved
  onTransformControlsChanged = () => {
    this.updateSelectionBox()

    guiEvents.dispatchEvent({
      type: GUIEditorEvent.ObjectTransformChanged,
    })
  }

  onSceneGraphObjectSelected = (event: GUIEvent[GUIEditorEvent.ObjectSelected]) => {
    this.currentObjectSelected = event.object
    this.onObjectEditModeChange(event.object, this.edit)
  }

  // Update the selection box dimensions when objects are selected
  updateSelectionBox() {
    this.selectionBox.visible = false
    const filter = [
      'Mesh', //
      'SkinnedMesh',
      'Object3D',
      'Group',
      'Points',
      'GridHelper',
      'AxesHelper',
    ]

    if (
      this.currentObjectSelected &&
      this.currentObjectSelected.visible &&
      filter.includes(this.currentObjectSelected.type)
    ) {
      this.box3.setFromObject(this.currentObjectSelected, true)
      this.selectionBox.visible = true
    }
  }

  // Enable or disable object editing
  onObjectEditModeChange = (object3d?: Object3D, enabled: boolean = false) => {
    if (object3d) {
      if (
        this.nonEditibleObjectTypes.includes(object3d.type) || //
        this.nonEditibleObjectNames.includes(object3d.name)
      ) {
        return
      }
    }

    this.selectionBox.visible = false
    if (enabled) {
      if (object3d) {
        this.transformControls.attach(object3d)
      }
      // Note: Main event listeners are handled in bindEvents()
      // These are specific to transform control interaction
      this.transformControls.addEventListener('mouseDown', this.onTransformControlsMouseDown)
      this.transformControls.addEventListener('mouseUp', this.onTransformControlsMouseUp)
      this.touchControls.addEventListener('end', this.onTouchEnd)
    } else {
      this.transformControls.detach()
      // Ensure camera controls are re-enabled when detaching
      if (GUIController.state.controls) {
        GUIController.state.controls.enabled = true
      }
      this.transformControls.removeEventListener('mouseDown', this.onTransformControlsMouseDown)
      this.transformControls.removeEventListener('mouseUp', this.onTransformControlsMouseUp)
      this.touchControls.removeEventListener('end', this.onTouchEnd)
    }

    this.touchControls.bindEvents(enabled)

    if (enabled) {
      this.updateSelectionBox()
    }
  }

  // Keyboard shortcuts for the transform controls
  onKeyPress = (event: KeyboardEvent) => {
    if (!this.transformControls) return
    switch (event.code) {
      case 'KeyQ': {
        this.transformControls.setSpace(this.transformControls.space === 'local' ? 'world' : 'local')
        break
      }
      case 'KeyW': {
        this.transformControls.setMode('translate')
        break
      }
      case 'KeyE': {
        this.transformControls.setMode('rotate')
        break
      }
      case 'KeyR': {
        this.transformControls.setMode('scale')
        break
      }
      default: {
        break
      }
    }
  }

  // Only allow these objects to be edited
  isObjectEditable(object: Object3D) {
    return (
      object.type === 'Object3D' ||
      object.type === 'Mesh' ||
      object.type === 'SkinnedMesh' ||
      object.type === 'PerspectiveCamera' ||
      object.type === 'DirectionalLight' ||
      object.type === 'HemisphereLight'
    )
  }

  // Get all editable objects from scene for efficient raycasting
  getEditableObjects(scene: Scene): Object3D[] {
    const editableObjects: Object3D[] = []
    scene.traverse((object: Object3D) => {
      if (this.isObjectEditable(object)) {
        editableObjects.push(object)
      }
    })
    return editableObjects
  }

  // Select objects when they are clicked
  onTouchEnd = (event: TouchControlsEvent['end']) => {
    if (this.transformControlsMoving) return
    this.pointer.x = event.pointers[0].normalX * 2 - 1
    this.pointer.y = -event.pointers[0].normalY * 2 + 1
    this.raycaster.setFromCamera(this.pointer, GUIController.state.camera)

    // Only raycast against editable objects for better performance
    const editableObjects = this.getEditableObjects(GUIController.state.scene)
    const intersects = this.raycaster.intersectObjects(editableObjects, false)

    let editableObject3D: Object3D | undefined
    if (intersects.length > 0) {
      editableObject3D = intersects[0].object
    }

    if (editableObject3D) {
      if (this.currentObjectSelected) {
        this.onEditableObjectSelected(this.currentObjectSelected, false)
      }

      this.currentObjectSelected = editableObject3D
      this.onEditableObjectSelected(editableObject3D, true)
    } else {
      this.selectionBox.visible = false
      this.transformControls.detach()
    }
  }

  onEditableObjectSelected = (object3d?: Object3D, enabled: boolean = false) => {
    this.onObjectEditModeChange(object3d, enabled)
  }

  onTransformControlsMouseUp = () => {
    clearTimeout(this.timeoutID)
    this.timeoutID = setTimeout(() => {
      this.transformControlsMoving = false

      // Backup camera enable on mouse up
      if (GUIController.state.controls) {
        GUIController.state.controls.enabled = true
      }
    }, 50)
  }

  onTransformControlsMouseDown = () => {
    this.transformControlsMoving = true

    // Backup camera disable on mouse down
    if (GUIController.state.controls) {
      GUIController.state.controls.enabled = false
    }
  }
  dispose() {
    this.bindEvents(false)
    this.touchControls.dispose()

    // Remove the permanently attached dragging-changed listener
    this.transformControls.removeEventListener('dragging-changed', this.onTransformControlsDraggingChanged)

    GUIController.state.scene.remove(this.container)
    GUIController.state.scene.remove(this.transformGizmo)
  }
}
