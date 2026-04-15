import { gsap } from 'gsap'

import GUIController from '@/webgl/utils/editor/gui/gui'
import { GlobeLineMaterial } from './globe-line-material'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { gsapEasingFunctionsGUIOptions } from '@/webgl/utils/common/easing'

// Animation settings class
class AnimationSettings {
  duration: number = 10 // seconds
  delay: number = 0
  easing: string = 'linear'
  loop: boolean = true
}

export default class GlobeAnimatedLines {
  settings: AnimationSettings = new AnimationSettings()
  tween: gsap.core.Tween | gsap.core.Timeline | null = null

  constructor(
    public material: GlobeLineMaterial,
    public key: string,
  ) {}

  play = () => {
    this.stop()

    this.tween = gsap.timeline({
      repeat: this.settings.loop ? -1 : 0,
    })

    // Animate both materials simultaneously
    this.tween.to([this.material.uniforms[this.key]], {
      value: 1,
      duration: this.settings.duration,
      delay: this.settings.delay,
      ease: this.settings.easing,
    })
  }

  stop = () => {
    if (this.tween) {
      this.tween.kill()
      this.tween = null
    }
    this.material.uniforms[this.key].value = 0
  }

  reset = () => {
    this.stop()
    this.material.uniforms[this.key].value = 0
  }

  setAnimationProgress(progress: number) {
    this.material.uniforms[this.key].value = progress
  }
}

/* #if DEBUG */
export class GUIGlobeAnimatedLines extends GUIController {
  constructor(gui: GUIType, target: GlobeAnimatedLines, title: string) {
    super(gui)

    this.gui = this.addFolder(gui, { title })

    this.gui.addButton({ title: 'Play' }).on('click', target.play)
    this.gui.addButton({ title: 'Stop' }).on('click', target.stop)
    this.gui
      .addBinding(target.settings, 'easing', {
        options: gsapEasingFunctionsGUIOptions,
      })
      .on('change', target.play)
    this.gui
      .addBinding(target.settings, 'duration', {
        min: 0,
        max: 10,
      })
      .on('change', target.play)

    this.gui
      .addBinding({ progress: 0 }, 'progress', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Progress',
      })
      .on('change', event => {
        target.setAnimationProgress(event.value)
      })
  }
}
/* #endif */
