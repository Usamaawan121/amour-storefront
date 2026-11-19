import { useEffect, useRef } from 'react'

export default function Showpiece() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = host.current
    if (!frame || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true })
    if (!context) return
    let active = true
    let dispose: (() => void) | undefined

    void import('./jewelScene').then(({ mountJewelScene }) => {
      if (active) dispose = mountJewelScene(frame, canvas, context)
    }).catch(() => {
      // The CSS jewelry display remains visible when WebGL cannot start.
    })

    return () => {
      active = false
      dispose?.()
      context.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return <div ref={host} className="showpiece" aria-hidden="true" />
}
