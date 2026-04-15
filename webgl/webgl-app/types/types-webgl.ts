export enum WebGLSceneId {
  Preloader = 'Preloader',
  Landing = 'Landing',
  Storybook = 'Storybook',
}

export enum Assets {
  Global = 'Global',
  Sounds = 'Sounds',
}

export enum SceneState {
  TransitionIn = 'TransitionIn',
  TransitionOut = 'TransitionOut',
}

export const AnimationEaseInOut = 'power1.inOut'
export const AnimationEaseOut = 'power1.out'
export const AnimationDuration = 0.5

export class Quality {
  static Medium = 'Medium'
  static High = 'High'
}

export interface WebGLSettings {
  baseUrl: string
  maxResolution: boolean
  gui: boolean
  renderPreview: boolean
  debugCamera: boolean
  helpers: boolean
  isDevelopment: boolean
  skipTransitions: boolean
  platform: 'desktop' | 'mobile'
}

export interface WebGLSettingsSerializable {
  maxResolution: boolean
  gui: boolean
  renderPreview: boolean
  debugCamera: boolean
  helpers: boolean
  isDevelopment: boolean
  skipTransitions: boolean
}

export enum Colors {
  Background = '#09090b',
}
