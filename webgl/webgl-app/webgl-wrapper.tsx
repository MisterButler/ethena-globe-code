'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

import Experience from './experience'
import experienceSupport from './experience-support'

interface WebGLWrapperProps {
  className?: string
  id?: string
  style?: React.CSSProperties
}

export function WebGLWrapper({ className = 'webgl-app', id = 'app', style }: WebGLWrapperProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const webglCreated = useRef<boolean | null>(null)
  const experienceRef = useRef<Experience | null>(null)
  const [globeVisible, setGlobeVisible] = useState(true)
  const [backgroundVisible, setBackgroundVisible] = useState(false)
  const [globeSize, setGlobeSize] = useState(6)
  const [globeStyle, setGlobeStyleState] = useState<'default' | 'classic'>('default')
  const [transactionLinesVisible, setTransactionLinesVisible] = useState(false)
  const [coastlinesVisible, setCoastlinesVisible] = useState(true)
  const [coastlinesBrightness, setCoastlinesBrightness] = useState(0.3)
  const [globeGlow, setGlobeGlow] = useState(6.0)
  const [outerGlow, setOuterGlow] = useState(0.18)
  const [rotationSpeed, setRotationSpeed] = useState(0.1)
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const root = rootRef.current

    if (!root) return () => {}

    if (!webglCreated.current) {
      webglCreated.current = true

      experienceRef.current = new Experience()

      experienceSupport
        .runTests()
        .then(experienceRef.current.setupWebGL)
        .catch(error => {
          console.error('WebGL setup failed:', error)
          const fallback = document.querySelector('.webgl-fallback')

          // Add fallback background tailwind styles
          if (fallback) {
            fallback.classList.remove('hidden')
            gsap.to(fallback, { duration: 3, opacity: 1 })
          }
        })

      // Push initial preset values into the experience once the landing
      // scene is actually constructed (it's async; shader defaults have
      // loaded but not our preset). Poll at 100ms up to 10s.
      let attempts = 0
      const applyPreset = () => {
        const exp = experienceRef.current
        const scene = exp?.webglApp?.sceneManager?.scene
        if (!scene) {
          if (attempts++ < 100) setTimeout(applyPreset, 100)
          return
        }
        exp!.setBackgroundVisible(false)
        exp!.setGlobeStyle('default')
        exp!.setTransactionLinesVisible(false)
        exp!.setCoastlinesVisible(true)
        exp!.setCoastlinesBrightness(0.3)
        exp!.setGlobeSize(6)
        exp!.setGlobeGlow(6.0)
        exp!.setOuterGlow(0.18)
        exp!.setGlobeRotationSpeed(0.1)
      }
      setTimeout(applyPreset, 100)

      return () => {}
    }
  }, [])

  const toggleGlobe = () => {
    const newValue = !globeVisible
    setGlobeVisible(newValue)
    experienceRef.current?.setGlobeVisible(newValue)
  }

  const toggleBackground = () => {
    const newValue = !backgroundVisible
    setBackgroundVisible(newValue)
    experienceRef.current?.setBackgroundVisible(newValue)
  }

  const onSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setGlobeSize(value)
    experienceRef.current?.setGlobeSize(value)
  }

  const onGlowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setGlobeGlow(value)
    experienceRef.current?.setGlobeGlow(value)
  }

  const onOuterGlowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setOuterGlow(value)
    experienceRef.current?.setOuterGlow(value)
  }

  const onRotationSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setRotationSpeed(value)
    experienceRef.current?.setGlobeRotationSpeed(value)
  }

  const toggleTransactionLines = () => {
    const next = !transactionLinesVisible
    setTransactionLinesVisible(next)
    experienceRef.current?.setTransactionLinesVisible(next)
  }

  const toggleCoastlines = () => {
    const next = !coastlinesVisible
    setCoastlinesVisible(next)
    experienceRef.current?.setCoastlinesVisible(next)
  }

  const onCoastlinesBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setCoastlinesBrightness(value)
    experienceRef.current?.setCoastlinesBrightness(value)
  }

  const toggleStyle = () => {
    const next = globeStyle === 'default' ? 'classic' : 'default'
    setGlobeStyleState(next)
    experienceRef.current?.setGlobeStyle(next)
  }

  const onRecord = async () => {
    if (recording) return
    setRecording(true)
    setProgress(0)
    try {
      await experienceRef.current?.recordGlobe({
        onProgress: (p) => setProgress(p),
        size: globeSize,
      })
    } catch (err) {
      console.error('Recording failed:', err)
      alert(`Recording failed: ${(err as Error).message}`)
    } finally {
      setRecording(false)
      setProgress(0)
    }
  }

  return (
    <>
      <div id={id} className={className} ref={rootRef} style={style} />
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          fontSize: 12,
          gap: 8,
          padding: 12,
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 1000,
        }}
      >
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input checked={globeVisible} onChange={toggleGlobe} type="checkbox" />
          Globe
        </label>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input checked={backgroundVisible} onChange={toggleBackground} type="checkbox" />
          Background
        </label>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input checked={globeStyle === 'classic'} onChange={toggleStyle} type="checkbox" />
          Classic Style
        </label>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input checked={transactionLinesVisible} onChange={toggleTransactionLines} type="checkbox" />
          Transaction Lines
        </label>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input checked={coastlinesVisible} onChange={toggleCoastlines} type="checkbox" />
          Coastlines
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Size: {globeSize.toFixed(2)}</span>
          <input
            type="range"
            min={1}
            max={12}
            step={0.1}
            value={globeSize}
            onChange={onSizeChange}
            style={{ width: 160 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Land Glow: {globeGlow.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={15}
            step={0.1}
            value={globeGlow}
            onChange={onGlowChange}
            style={{ width: 160 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Outer Glow: {outerGlow.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={outerGlow}
            onChange={onOuterGlowChange}
            style={{ width: 160 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Coastlines Brightness: {coastlinesBrightness.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={coastlinesBrightness}
            onChange={onCoastlinesBrightnessChange}
            style={{ width: 160 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Rotation Speed: {rotationSpeed.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={rotationSpeed}
            onChange={onRotationSpeedChange}
            style={{ width: 160 }}
          />
        </label>
        <button
          type="button"
          onClick={onRecord}
          disabled={recording}
          style={{
            background: recording ? '#555' : '#e04a3f',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: recording ? 'default' : 'pointer',
            fontFamily: 'monospace',
            fontSize: 12,
            padding: '8px 10px',
          }}
        >
          {recording ? `Recording ${(progress * 100).toFixed(0)}%` : 'Export 4K MP4 (30s)'}
        </button>
      </div>
    </>
  )
}
