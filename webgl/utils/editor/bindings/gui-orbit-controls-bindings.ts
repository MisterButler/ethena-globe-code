import { MathUtils } from 'three'
import { OrbitControls } from '@/webgl/utils/common/OrbitControls.js'

import { saveJsonFile } from '../../common/basic-functions'
import { GUIType } from '../gui/gui-types'

export type OrbitControlsSettings = {
  minDistance: number
  maxDistance: number
  minZoom: number
  maxZoom: number
  minTargetRadius: number
  maxTargetRadius: number
  minPolarAngle: number
  maxPolarAngle: number
  minAzimuthAngle: number
  maxAzimuthAngle: number
  enableDamping: boolean
  dampingFactor: number
  enableZoom: boolean
  enableRotate: boolean
  rotateSpeed: number
  enablePan: boolean
  panSpeed: number
  autoRotate: boolean
  autoRotateSpeed: number
}

export function orbitControlsBinding(gui: GUIType, object: OrbitControls) {
  const MAX_INFINITY = 100000

  const api = {
    minPolarAngle: MathUtils.radToDeg(object.minPolarAngle),
    maxPolarAngle: MathUtils.radToDeg(object.maxPolarAngle),
    minAzimuthAngle: MathUtils.radToDeg(object.minAzimuthAngle),
    maxAzimuthAngle: MathUtils.radToDeg(object.maxAzimuthAngle),
    maxZoom: object.maxZoom,
  }

  const onChange = () => {
    object.minPolarAngle = MathUtils.degToRad(api.minPolarAngle)
    object.maxPolarAngle = MathUtils.degToRad(api.maxPolarAngle)
    object.minAzimuthAngle = MathUtils.degToRad(api.minAzimuthAngle)
    object.maxAzimuthAngle = MathUtils.degToRad(api.maxAzimuthAngle)
  }

  // Handle Infinity values for Tweakpane
  if (object.maxDistance === Infinity) {
    object.maxDistance = MathUtils.clamp(object.maxDistance, 0, MAX_INFINITY)
  }

  if (object.maxZoom === Infinity) {
    object.maxZoom = MathUtils.clamp(object.maxZoom, 0, MAX_INFINITY)
  }

  if (object.maxTargetRadius === Infinity) {
    object.maxTargetRadius = MathUtils.clamp(object.maxTargetRadius, 0, MAX_INFINITY)
  }

  if (object.minAzimuthAngle === -Infinity) {
    object.minAzimuthAngle = MathUtils.clamp(object.minAzimuthAngle, -MAX_INFINITY, MAX_INFINITY)
  }

  if (object.maxAzimuthAngle === Infinity) {
    object.maxAzimuthAngle = MathUtils.clamp(object.maxAzimuthAngle, -MAX_INFINITY, MAX_INFINITY)
  }

  gui.addBinding(object, 'enabled')
  gui.addBinding(object, 'minDistance')
  gui.addBinding(object, 'maxDistance')
  gui.addBinding(object, 'minZoom')
  gui.addBinding(object, 'maxZoom')
  gui.addBinding(object, 'minTargetRadius')
  gui.addBinding(object, 'maxTargetRadius')
  gui.addBinding(api, 'minPolarAngle').on('change', onChange)
  gui.addBinding(api, 'maxPolarAngle').on('change', onChange)
  gui.addBinding(object, 'minAzimuthAngle').on('change', onChange)
  gui.addBinding(object, 'maxAzimuthAngle').on('change', onChange)
  gui.addBinding(object, 'enableDamping')
  gui.addBinding(object, 'dampingFactor')
  gui.addBinding(object, 'enableZoom')
  gui.addBinding(object, 'enableRotate')
  gui.addBinding(object, 'rotateSpeed')
  gui.addBinding(object, 'enablePan')
  gui.addBinding(object, 'panSpeed')
  gui.addBinding(object, 'autoRotate')
  gui.addBinding(object, 'autoRotateSpeed')
  gui.addBinding(object, 'target')
}

export function saveOrbitControlsSettings(object: OrbitControls) {
  const data: OrbitControlsSettings = {
    minDistance: object.minDistance,
    maxDistance: object.maxDistance,
    minZoom: object.minZoom,
    maxZoom: object.maxZoom,
    minTargetRadius: object.minTargetRadius,
    maxTargetRadius: object.maxTargetRadius,
    minPolarAngle: MathUtils.radToDeg(object.minPolarAngle),
    maxPolarAngle: MathUtils.radToDeg(object.maxPolarAngle),
    minAzimuthAngle: MathUtils.radToDeg(object.minAzimuthAngle),
    maxAzimuthAngle: MathUtils.radToDeg(object.maxAzimuthAngle),
    enableDamping: object.enableDamping,
    dampingFactor: object.dampingFactor,
    enableZoom: object.enableZoom,
    enableRotate: object.enableRotate,
    rotateSpeed: object.rotateSpeed,
    enablePan: object.enablePan,
    panSpeed: object.panSpeed,
    autoRotate: object.autoRotate,
    autoRotateSpeed: object.autoRotateSpeed,
  }
  saveJsonFile(JSON.stringify(data, null, 2), 'orbit-controls-settings')
}

export function loadControlsSettings(object: OrbitControls, settings: OrbitControlsSettings) {
  const degToRadProps = ['minPolarAngle', 'maxPolarAngle', 'minAzimuthAngle', 'maxAzimuthAngle']

  Object.keys(settings).forEach(key => {
    if (degToRadProps.includes(key)) {
      //@ts-expect-error expected
      object[key] = MathUtils.degToRad(settings[key])
    } else {
      //@ts-expect-error expected
      object[key] = settings[key]
    }
  })
}
