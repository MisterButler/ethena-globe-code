import Stats from 'stats-gl'
import { WebGLRenderer } from 'three'

import GUIController from './editor/gui/gui'
import { GUIType } from './editor/gui/gui-types'

export default class GUIRenderStats extends GUIController {
  lastTime = Date.now()
  info: { [key: string]: string } = {
    fps: '',
    ms: '',
    gpu: '',
    programs: '',
    geometries: '',
    textures: '',
    calls: '',
    triangles: '',
    lines: '',
    points: '',
    memory: '',
  }

  constructor(
    gui: GUIType,
    public renderer: WebGLRenderer,
    public stats: Stats,
  ) {
    super(gui)

    this.gui = this.addFolder(gui, { title: 'Render Stats' })
    this.folders.stats = this.addFolder(this.gui, { title: 'Stats' })
    this.folders.info = this.addFolder(this.gui, { title: 'WebGL' })

    this.folders.info.addBinding(this.info, 'programs', { readonly: true })
    this.folders.info.addBinding(this.info, 'geometries', {
      readonly: true,
    })
    this.folders.info.addBinding(this.info, 'textures', { readonly: true })
    this.folders.info.addBinding(this.info, 'calls', { readonly: true })
    this.folders.info.addBinding(this.info, 'triangles', {
      readonly: true,
    })
    this.folders.info.addBinding(this.info, 'lines', { readonly: true })
    this.folders.info.addBinding(this.info, 'points', { readonly: true })
    this.folders.info.addBinding(this.info, 'memory', { readonly: true })

    const fps = this.folders.stats.addBinding(this.info, 'fps', {
      readonly: true,
    })
    const ms = this.folders.stats.addBinding(this.info, 'ms', {
      readonly: true,
    })

    fps.controller.view.valueElement.children[0]
      .querySelectorAll('input')[0]
      //@ts-expect-error expected
      .replaceWith(stats.fpsPanel.canvas)
    ms.controller.view.valueElement.children[0]
      .querySelectorAll('input')[0]
      //@ts-expect-error expected
      .replaceWith(stats.msPanel.canvas)

    //@ts-expect-error expected
    if (stats.gpuPanel) {
      const gpu = this.folders.stats.addBinding(this.info, 'gpu', {
        readonly: true,
      })
      gpu.controller.view.valueElement.children[0]
        .querySelectorAll('input')[0]
        //@ts-expect-error expected
        .replaceWith(stats.gpuPanel.canvas)
    }
  }

  update = () => {
    if (Date.now() - this.lastTime < 1000 / 30) return
    if (!this.renderer) return
    this.lastTime = Date.now()
    this.info.programs = `${this.renderer.info.programs?.length}`
    this.info.geometries = `${this.renderer.info.memory.geometries}`
    this.info.textures = `${this.renderer.info.memory.textures}`
    this.info.calls = `${this.renderer.info.render.calls}`
    this.info.triangles = `${this.renderer.info.render.triangles}`
    this.info.lines = `${this.renderer.info.render.lines}`
    this.info.points = `${this.renderer.info.render.points}`
    this.info.memory = `${this.getCurrentMemory()}mb/${this.getMaxMemory()}mb`
  }

  getMaxMemory() {
    return Math.round(window.performance.memory ? window.performance.memory.jsHeapSizeLimit / 1048576 : 0)
  }

  getCurrentMemory() {
    return Math.round(
      window.performance && window.performance.memory ? window.performance.memory.usedJSHeapSize / 1048576 : 0,
    )
  }

  dispose(): void {
    super.dispose()
  }
}
