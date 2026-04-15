import { EventDispatcher } from 'three'

import { detect } from '../common/detect'

export type TouchControlsOptions = {
  touchStart?: boolean
  touchMove?: boolean
  touchEnd?: boolean
  hover?: boolean
}

export type Pointer = {
  x: number
  y: number
  normalX: number
  normalY: number
  velocityX?: number
  velocityY?: number
}

export type AppTouchEvent = TouchEvent

export interface TouchControlsEvent {
  start: { pointers: Pointer[] }
  move: { pointers: Pointer[] }
  end: { pointers: Pointer[] }
  mousemove: { pointers: Pointer[] }
  hover: { over: boolean }
}

/**
 * A class to normalize mouse and touch events
 *
 * @export
 * @class TouchControls
 * @extends {EventEmitter}
 */
export default class TouchControls extends EventDispatcher<TouchControlsEvent> {
  element: HTMLElement
  pointers: Array<Pointer> = []
  options: TouchControlsOptions = {
    hover: false, // mouse only
    touchStart: true,
    touchMove: true,
    touchEnd: true,
  }
  isDown = false

  constructor(element: HTMLElement, options: TouchControlsOptions = {}) {
    super()
    this.element = element
    this.options = Object.assign(this.options, options)
  }

  /**
   * Bind mouse and touch events
   *
   * @param {boolean} bind
   * @memberof TouchControls
   */
  bindEvents = (bind: boolean) => {
    if (bind) {
      if (detect.device.desktop) {
        if (this.options.touchStart) this.element.addEventListener('mousedown', this.onTouchStart)
        if (this.options.touchMove) this.element.addEventListener('mousemove', this.onTouchMove)
        if (this.options.touchEnd) this.element.addEventListener('mouseup', this.onTouchEnd)
        if (this.options.hover) this.element.addEventListener('mouseover', this.onMouseOver)
        if (this.options.hover) this.element.addEventListener('mouseout', this.onMouseOut)
      } else {
        if (this.options.touchStart) this.element.addEventListener('touchstart', this.onTouchStart)
        if (this.options.touchMove) this.element.addEventListener('touchmove', this.onTouchMove)
        if (this.options.touchEnd) this.element.addEventListener('touchend', this.onTouchEnd)
      }
    } else {
      if (detect.device.desktop) {
        if (this.options.touchStart) this.element.removeEventListener('mousedown', this.onTouchStart)
        if (this.options.touchMove) this.element.removeEventListener('mousemove', this.onTouchMove)
        if (this.options.touchEnd) this.element.removeEventListener('mouseup', this.onTouchEnd)
        if (this.options.hover) this.element.removeEventListener('mouseover', this.onMouseOver)
        if (this.options.hover) this.element.removeEventListener('mouseout', this.onMouseOut)
      } else {
        if (this.options.touchStart) this.element.removeEventListener('touchstart', this.onTouchStart)
        if (this.options.touchMove) this.element.removeEventListener('touchmove', this.onTouchMove)
        if (this.options.touchEnd) this.element.removeEventListener('touchend', this.onTouchEnd)
      }
    }
  }

  /**
   * Update the list of current inputs
   *
   * @param {(TouchEvent | MouseEvent)} event
   * @memberof TouchControls
   */
  setPointers = (event: AppTouchEvent | MouseEvent) => {
    this.pointers = []

    const rect = this.element.getBoundingClientRect() // Get canvas position and size

    // @ts-expect-error touch
    if (event.touches && event.touches.length > 0) {
      // @ts-expect-error touch
      for (let i = 0; i < event.touches.length; i++) {
        // @ts-expect-error touch
        const pointer = event.touches[i]
        this.pointers.push({
          x: pointer.pageX,
          y: pointer.pageY,
          normalX: (pointer.clientX - rect.left) / rect.width,
          normalY: (pointer.clientY - rect.top) / rect.height,
        })
      }
    } else if (event instanceof MouseEvent) {
      this.pointers.push({
        x: event.clientX,
        y: event.clientY,
        normalX: (event.clientX - rect.left) / rect.width,
        normalY: (event.clientY - rect.top) / rect.height,
      })
    }
  }

  /**
   * Touch start handler
   *
   * @param {(TouchEvent | MouseEvent)} event
   * @memberof TouchControls
   */
  onTouchStart = (event: TouchEvent | MouseEvent) => {
    this.isDown = true
    this.setPointers(event)
    this.dispatchEvent({ type: 'start', pointers: this.pointers })
  }

  /**
   * Touch move handler
   *
   * @param {(TouchEvent | MouseEvent)} event
   * @memberof TouchControls
   */
  onTouchMove = (event: TouchEvent | MouseEvent) => {
    this.onMouseMove(event)
    if (!this.isDown) return
    this.setPointers(event)
    this.dispatchEvent({ type: 'move', pointers: this.pointers })
  }

  /**
   * Touch end handler
   *
   * @memberof TouchControls
   */
  onTouchEnd = () => {
    this.isDown = false
    this.dispatchEvent({ type: 'end', pointers: this.pointers })
  }

  /**
   * Mouse move handler
   *
   * @param {(TouchEvent | MouseEvent)} event
   * @memberof TouchControls
   */
  onMouseMove = (event: TouchEvent | MouseEvent) => {
    this.setPointers(event)
    this.dispatchEvent({ type: 'mousemove', pointers: this.pointers })
  }

  /**
   * Mouse over handler
   *
   * @param {MouseEvent} _event
   * @memberof TouchControls
   */
  onMouseOver = () => {
    this.dispatchEvent({ type: 'hover', over: true })
  }

  /**
   * Mouse out handler
   *
   * @param {MouseEvent} _event
   * @memberof TouchControls
   */
  onMouseOut = () => {
    this.dispatchEvent({ type: 'hover', over: false })
  }

  /**
   * Dispose and unbind events
   *
   * @memberof TouchControls
   */
  dispose = () => {
    this.bindEvents(false)
  }
}
