import { Clock } from 'three'

class TimeUtils {
  _delta = 0
  _time = 0
  clock: Clock = new Clock(true)
  maxTime = 20 // minutes

  update() {
    this._delta = this.clock.getDelta()
    this._time = this.clock.elapsedTime

    // Ensure the elpased time doesn't exceed the max time
    // This prevents large numbers, visual artifacts in shaders
    if (this._time > this.maxTime * 60) {
      this._time = 0
      this.clock.start()
    }
  }

  updateManual(delta: number) {
    this._delta = delta
    this._time += delta
  }

  get delta() {
    return this._delta
  }

  get elapsedTime() {
    return this._time
  }
}

const Time = new TimeUtils()

export default Time

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const formattedHours = String(hours).padStart(2, '0')
  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}
