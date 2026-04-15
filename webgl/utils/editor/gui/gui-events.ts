import { EventDispatcher, Object3D, PerspectiveCamera, Scene } from 'three'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls.js'

export enum GUIEditorEvent {
  ObjectSelected = 'object-selected',
  ObjectTransformChanged = 'object-transform-changed',
  SceneChanged = 'scene-changed',
  SceneGraphChanged = 'scene-graph-changed',
  ViewportEditModeChanged = 'viewport-command-edit-changed',
  ViewportHelpersChanged = 'viewport-command-helpers-changed',
}

export interface GUIEvent {
  [GUIEditorEvent.ObjectSelected]: { object: Object3D }
  [GUIEditorEvent.ObjectTransformChanged]: object
  [GUIEditorEvent.SceneChanged]: {
    scene: Scene
    camera: PerspectiveCamera
    controls: OrbitControls
  }
  [GUIEditorEvent.SceneGraphChanged]: object
  [GUIEditorEvent.ViewportEditModeChanged]: { edit: boolean }
  [GUIEditorEvent.ViewportHelpersChanged]: { visible: boolean }
}

const guiEvents = new EventDispatcher<GUIEvent>()

export default guiEvents
