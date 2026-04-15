import Stats from 'stats-gl'

const ENABLED = false

class PerformanceStats {
  stats!: Stats
  isRunning: boolean = false
  rafId: number = 0

  setup() {
    if (ENABLED) {
      this.stats = new Stats({
        minimal: true,
      })
      document.body.appendChild(this.stats.dom)
    }
  }

  run = (enable: boolean) => {
    if (!ENABLED) return
    if (this.isRunning === enable) return
    this.isRunning = enable
    if (enable) {
      this.update()
    } else {
      cancelAnimationFrame(this.rafId)
    }
  }

  update = () => {
    this.rafId = requestAnimationFrame(this.update)
    this.stats.update()
  }
}

const performanceStats = new PerformanceStats()

export default performanceStats
