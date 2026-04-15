import gsap from 'gsap'
import { Euler, PerspectiveCamera, Vector3Tuple } from 'three'

import { OrbitControls } from '@/webgl/utils/common/OrbitControls.js'
import GUIController from '@/webgl/utils/editor/gui/gui'
import { GUIType } from '@/webgl/utils/editor/gui/gui-types'
import { generateBindingOptions } from '@/webgl/utils/editor/gui/gui-utils'

import { saveJsonFile } from './basic-functions'
import { safeJsonParse } from './security-utils'

export type Bookmark = {
  position: number[]
  rotation: Array<number | string | undefined>
  target: number[]
}

export type Bookmarks = { [key: string]: Bookmark }

export default class BookmarkManager {
  bookmark = '1'
  bookmarks: Bookmarks = {}
  animate = true

  constructor(
    public id: string,
    public camera: PerspectiveCamera,
    public controls: OrbitControls,
  ) {
    for (let i = 0; i < 9; i++) {
      this.bookmarks[i.toString()] = {
        position: [0, 1, 5],
        rotation: [0, 0, 0, Euler.DEFAULT_ORDER],
        target: [0, 0, 0],
      }
    }

    this.loadBookmarks()
    this.goToBookmark('0', false)
    // this.addKeyListener();
  }

  addKeyListener() {
    window.addEventListener('keydown', event => {
      if (event.key >= '0' && event.key <= '9') {
        this.animateToBookmark(event.key)
      }
    })
  }

  get storeId() {
    return `bookmarks-${this.id}`
  }

  get totalBookmarks() {
    return Object.keys(this.bookmarks).length
  }

  loadBookmarks(useLocalStorage = true) {
    // if (data) {
    //   for (const key in data) {
    //     if (Object.prototype.hasOwnProperty.call(data, key)) {
    //       this.bookmarks[key] = data[key];
    //     }
    //   }
    // }

    if (useLocalStorage) {
      const data = localStorage.getItem(this.storeId) as string

      if (data) {
        const parsedBookmarks = safeJsonParse<Bookmarks>(data)

        if (parsedBookmarks) {
          this.bookmarks = parsedBookmarks
        } else {
          console.warn('Failed to parse bookmarks from localStorage, using defaults')
          this.bookmarks = {}
        }
      }
    }
  }

  goToBookmark(name: string, animate = this.animate) {
    if (animate) {
      this.animateToBookmark(name)
      return
    }

    this.camera.position.fromArray(this.bookmarks[name].position)

    this.camera.rotation.fromArray(this.bookmarks[name].rotation as [number, number, number])

    this.camera.updateMatrixWorld()

    if (Array.isArray(this.bookmarks[name].target)) {
      this.controls.target.fromArray(this.bookmarks[name].target as Vector3Tuple)
    }

    this.controls.update()
  }

  killTweens() {
    gsap.killTweensOf(this.camera.position)
    gsap.killTweensOf(this.camera.rotation)
    gsap.killTweensOf(this.controls.target)
  }

  animateToBookmark(
    name: string,
    duration: number = 1,
    delay: number = 0,
    ease: string = 'power2.inOut',
    onProgress?: (percent: number) => void,
  ) {
    return new Promise<void>(resolve => {
      const bookmark = this.bookmarks[name]

      const tween = gsap.to(this.camera.position, {
        delay,
        duration: duration,
        ease,
        onUpdate: () => {
          this.camera.updateMatrixWorld()
          this.controls.update()

          if (onProgress) {
            onProgress(tween.progress())
          }
        },
        x: bookmark.position[0],
        y: bookmark.position[1],
        z: bookmark.position[2],
      })

      gsap.to(this.camera.rotation, {
        delay,
        duration: duration,
        ease,
        onComplete: () => {
          resolve()
        },
        onUpdate: () => {
          this.camera.updateMatrixWorld()
          this.controls.update()
        },
        x: bookmark.rotation[0] as number,
        y: bookmark.rotation[1] as number,
        z: bookmark.rotation[2] as number,
      })

      if (Array.isArray(bookmark.target)) {
        gsap.to(this.controls.target, {
          delay,
          duration: duration,
          ease,
          onUpdate: () => {
            this.controls.update()
          },
          x: bookmark.target[0],
          y: bookmark.target[1],
          z: bookmark.target[2],
        })
      }
    })
  }
}

export class GUIBookmarkManager extends GUIController {
  constructor(gui: GUIType, target: BookmarkManager) {
    super(gui)
    this.gui = this.addFolder(gui, { title: 'BookmarkManager' })

    const bookmarks = Object.keys(target.bookmarks)

    this.gui
      .addBinding(target, 'bookmark', {
        options: generateBindingOptions(bookmarks),
      })
      .on('change', event => {
        target.goToBookmark(event.value)
      })

    this.gui.addButton({ label: '', title: 'Reset Camera' }).on('click', () => {
      target.goToBookmark(target.bookmark.toString())
    })

    this.gui.addButton({ label: '', title: 'Save' }).on('click', () => {
      const data: Bookmark = {
        position: target.camera.position.toArray(),
        rotation: target.camera.rotation.toArray(),
        target: target.controls.target.toArray(),
      }

      target.bookmarks[target.bookmark.toString()] = data
      localStorage.setItem(target.storeId, JSON.stringify(target.bookmarks))
    })

    this.gui.addButton({ label: '', title: 'Export' }).on('click', () => {
      saveJsonFile(JSON.stringify(target.bookmarks, null, 2), 'bookmarks')
    })
  }
}
