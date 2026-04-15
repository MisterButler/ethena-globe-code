import { getQueryFromParams } from '../utils/common/query-params'

import store from './store'
import { webglSyncEvent } from './webgl-event'

declare global {
  interface Navigator {
    getBattery?: () => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

class ExperienceSupport {
  id = 'ExperienceSupport'

  batteryLevel: number = 100
  lowPower: boolean = false
  glContextRef?: WebGL2RenderingContext | null
  runningTests = false
  webglEnabled = false
  crashDetected = false
  crashThreshold = 2 // how many crashes before we disable the experience
  cooldownTime = 5 //mins
  supported = false

  constructor() {
    this.checkGLContextSupport()

    this.webglEnabled = !!this.glContextRef

    if (getQueryFromParams('fallback', window) === 'true') {
      this.webglEnabled = false
    }

    const onContextLost = () => {
      console.log('[ExperienceContext] WebGL context lost, reporting crash.')

      store.set(this.id, 'totalcrashes', (Number(store.get(this.id, 'totalcrashes')) || 0) + 1)

      store.set(this.id, 'lastCrashTime', Date.now())

      this.checkCrashStatus()
    }

    webglSyncEvent.addEventListener('contextLost', onContextLost)
  }

  async checkBatteryStatus() {
    try {
      if (!navigator.getBattery) {
        // console.warn(
        //   "[ExperienceContext] Battery API not supported in this browser."
        // );
        return
      }

      const battery = await navigator.getBattery()

      const updateBatteryStatus = () => {
        this.batteryLevel = battery.level * 100
        this.lowPower = battery.level * 100 < 5
      }

      updateBatteryStatus()

      battery.addEventListener('chargingchange', updateBatteryStatus)
      battery.addEventListener('levelchange', updateBatteryStatus)

      return () => {
        battery.removeEventListener('chargingchange', updateBatteryStatus)
        battery.removeEventListener('levelchange', updateBatteryStatus)
      }
    } catch (error) {
      console.warn('[ExperienceContext] Battery API error:', error)
    }
  }

  checkGLContextSupport() {
    if (!this.glContextRef) {
      try {
        const canvas = document.createElement('canvas')
        this.glContextRef = canvas.getContext('webgl2')
      } catch {
        this.glContextRef = null
      }
    }
  }

  async runTests() {
    await this.checkBatteryStatus()
    this.checkCrashStatus()
    this.supported = this.webglEnabled && !this.lowPower && !this.crashDetected

    // this.supported = false;

    // console.log("webglEnabled:", this.webglEnabled);
    // console.log("lowPower:", this.lowPower);
    // console.log("crashDetected:", this.crashDetected);
    // console.log("supported:", this.supported);

    return new Promise<void>((resolve, reject) => {
      if (this.supported) {
        resolve()
      } else {
        console.warn('[ExperienceContext] Experience is not supported, running fallback.')

        reject('Experience not supported')
      }
    })
  }

  checkCrashStatus = () => {
    const totalCrashes = Number(store.get(this.id, 'totalcrashes')) || 0
    const lastCrashTime = Number(store.get(this.id, 'lastCrashTime')) || 0

    const timeSinceLastCrash = Date.now() - lastCrashTime

    // const formattedTimeSinceCrash = formatTime(timeSinceLastCrash);
    // console.log(`Time since last crash: ${formattedTimeSinceCrash}`);

    if (!lastCrashTime) {
      this.crashDetected = false
    } else {
      // Format timeSinceLastCrash into human-readable format

      if (totalCrashes >= this.crashThreshold && timeSinceLastCrash > this.cooldownTime * 60 * 1000) {
        // console.log("Resetting crash data after cooldown period.");
        store.set(this.id, 'totalcrashes', 0)
        store.set(this.id, 'lastCrashTime', 0)
        this.crashDetected = false
      } else {
        this.crashDetected = totalCrashes >= this.crashThreshold
      }
    }
  }
}

export default new ExperienceSupport() // eslint-disable-line import/no-anonymous-default-export
