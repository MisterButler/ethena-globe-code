import type { FolderApi, TabPageApi } from 'tweakpane'

export type GUIType = FolderApi | TabPageApi

export type Vector3Options = {
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  zMin?: number
  zMax?: number
  step?: number
}
