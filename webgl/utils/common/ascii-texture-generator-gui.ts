import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'

import ASCIITextureGenerator from './ascii-texture-generator'
import { safeSetInnerHTML } from './security-utils'

export class GUIASCIITextureGenerator extends GUIController {
  private target: ASCIITextureGenerator
  private onUpdateCallback?: () => void

  constructor(gui: GUIType, target: ASCIITextureGenerator, onUpdate?: () => void) {
    super(gui)

    this.target = target
    this.onUpdateCallback = onUpdate

    this.gui = this.addFolder(gui, { title: 'ASCII Generator' })

    this.setupControls()
  }

  private setupControls(): void {
    const options = this.target.getOptions()

    // Create API object for Tweakpane bindings
    const asciiApi = {
      backgroundColor: options.backgroundColor,
      cellSize: options.cellSize,
      characters: options.characters,
      fontFamily: options.fontFamily,
      fontSize: options.fontSize,
      gridHeight: options.gridHeight,
      gridWidth: options.gridWidth,
      jitter: options.jitter,
      jitterAmount: options.jitterAmount,
      regenerateNow: () => this.regenerateTexture(),
      textColor: options.textColor,
    }

    // Grid settings folder
    const gridFolder = this.addFolder(this.gui, { title: 'Grid Settings' })

    gridFolder
      .addBinding(asciiApi, 'gridWidth', {
        label: 'Grid Width',
        max: 128,
        min: 4,
        step: 1,
      })
      .on('change', () => {
        this.updateOptions({ gridWidth: asciiApi.gridWidth })
      })

    gridFolder
      .addBinding(asciiApi, 'gridHeight', {
        label: 'Grid Height',
        max: 64,
        min: 4,
        step: 1,
      })
      .on('change', () => {
        this.updateOptions({ gridHeight: asciiApi.gridHeight })
      })

    gridFolder
      .addBinding(asciiApi, 'cellSize', {
        label: 'Cell Size',
        max: 64,
        min: 8,
        step: 1,
      })
      .on('change', () => {
        this.updateOptions({ cellSize: asciiApi.cellSize })
      })

    // Font settings folder
    const fontFolder = this.addFolder(this.gui, { title: 'Font Settings' })

    fontFolder
      .addBinding(asciiApi, 'fontSize', {
        label: 'Font Size',
        max: 48,
        min: 6,
        step: 1,
      })
      .on('change', () => {
        this.updateOptions({ fontSize: asciiApi.fontSize })
      })

    fontFolder
      .addBinding(asciiApi, 'fontFamily', {
        label: 'Font Family',
        options: {
          Consolas: 'Consolas',
          Courier: 'courier',
          'Liberation Mono': 'Liberation Mono',
          Monaco: 'Monaco',
          Monospace: 'monospace',
        },
      })
      .on('change', () => {
        this.updateOptions({ fontFamily: asciiApi.fontFamily })
      })

    // Content & Colors folder
    const contentFolder = this.addFolder(this.gui, {
      title: 'Content & Colors',
    })

    contentFolder
      .addBinding(asciiApi, 'characters', {
        label: 'Characters',
      })
      .on('change', () => {
        this.updateOptions({ characters: asciiApi.characters })
      })

    contentFolder
      .addBinding(asciiApi, 'textColor', {
        label: 'Text Color',
        view: 'color',
      })
      .on('change', () => {
        this.updateOptions({ textColor: asciiApi.textColor })
      })

    contentFolder
      .addBinding(asciiApi, 'backgroundColor', {
        label: 'Background Color',
        view: 'color',
      })
      .on('change', () => {
        this.updateOptions({ backgroundColor: asciiApi.backgroundColor })
      })

    // Effects folder
    const effectsFolder = this.addFolder(this.gui, { title: 'Effects' })

    effectsFolder
      .addBinding(asciiApi, 'jitter', {
        label: 'Enable Jitter',
      })
      .on('change', () => {
        this.updateOptions({ jitter: asciiApi.jitter })
      })

    effectsFolder
      .addBinding(asciiApi, 'jitterAmount', {
        label: 'Jitter Amount',
        max: 1,
        min: 0,
        step: 0.01,
      })
      .on('change', () => {
        this.updateOptions({ jitterAmount: asciiApi.jitterAmount })
      })

    // Actions folder
    const actionsFolder = this.addFolder(this.gui, { title: 'Actions' })

    actionsFolder
      .addButton({
        title: 'Regenerate Now',
      })
      .on('click', asciiApi.regenerateNow)

    // Debug folder
    const debugFolder = this.addFolder(this.gui, { title: 'Debug' })

    debugFolder
      .addButton({
        title: 'Show Canvas',
      })
      .on('click', () => {
        this.showCanvasInNewWindow()
      })
  }

  private updateOptions(options: Parameters<ASCIITextureGenerator['updateOptions']>[0]): void {
    this.target.updateOptions(options)
    this.regenerateTexture()
  }

  private regenerateTexture(): void {
    // The texture regeneration will be handled by the callback
    // since different contexts (Background vs Storybook) handle it differently
    if (this.onUpdateCallback) {
      this.onUpdateCallback()
    }
  }

  private showCanvasInNewWindow(): void {
    const canvas = this.target.getCanvas()
    const win = window.open('', '_blank', 'width=800,height=600')

    if (win) {
      win.document.body.style.margin = '0'
      win.document.body.style.padding = '20px'
      win.document.body.style.backgroundColor = '#f0f0f0'
      win.document.body.style.fontFamily = 'monospace'

      const title = win.document.createElement('h2')
      title.textContent = 'ASCII Texture Generator Debug Canvas'
      title.style.marginBottom = '20px'
      win.document.body.appendChild(title)

      const options = this.target.getOptions()
      const info = win.document.createElement('div')
      const width = canvas.width
      const height = canvas.height
      const characters = options.characters
      const characterSet = characters.length > 0 ? characters : 'N/A'
      const dataURL = canvas.toDataURL('image/png')

      safeSetInnerHTML(
        info,
        `
<div class="ascii-art">
<strong>ASCII Texture Generator</strong><br>
Width: ${width}px, Height: ${height}px<br>
Characters: ${characters.length}<br>
Pattern: "${characterSet}"<br>
<a href="${dataURL}" download="ascii-texture.png">Download Texture</a>
</div>
`,
      )

      info.style.marginBottom = '20px'
      info.style.fontSize = '14px'
      win.document.body.appendChild(info)

      const canvasClone = canvas.cloneNode(true) as HTMLCanvasElement
      canvasClone.style.border = '2px solid #999'
      canvasClone.style.borderRadius = '4px'
      canvasClone.style.imageRendering = 'pixelated'
      win.document.body.appendChild(canvasClone)

      win.document.title = 'ASCII Texture Debug'
    }
  }

  /**
   * Get the current options from the target
   */
  getOptions() {
    return this.target.getOptions()
  }

  /**
   * Update the target reference (useful for when the generator is recreated)
   */
  updateTarget(target: ASCIITextureGenerator): void {
    this.target = target
  }
}
