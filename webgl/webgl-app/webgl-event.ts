import { EventDispatcher } from 'three'

export interface WebGLSyncEvent {
  contextLost: object
}

export const webglSyncEvent = new EventDispatcher<WebGLSyncEvent>()
