'use client'

import dynamic from 'next/dynamic'

const WebGLWrapper = dynamic(
  () => import('@/webgl/webgl-app/webgl-wrapper').then(mod => mod.WebGLWrapper),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="webgl-container">
      <WebGLWrapper />
    </main>
  )
}
