import { useCallback, useEffect, useRef, useState } from 'react'

type Ripple = { x: number; y: number; t: number; id: number }
type Mode = 'pulse' | 'cascade' | 'trace'

const ACCENT = '#00FF41'
const FOOTER =
  'SYSTEM: TRINITYWAYVE | ARCHITECT: THEODOR^%°¢(KÜNNAPUU) | SOURCE: LINDA VIIDING | LÄBIMURDE ANKUR: ACTIVE | STATUS: OMNI-SOVEREIGN'

const HUBS = [
  { label: 'Command Center', href: 'https://trinitywayve-command-center.vercel.app/' },
  { label: 'Aura', href: 'https://trinitywayve-aura.vercel.app/' },
  { label: 'Orchestrator', href: 'https://trinitywayve-orchestrator.vercel.app/' },
  { label: 'Audit', href: 'https://trinitywayve-audit.vercel.app/' },
] as const

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ripplesRef = useRef<Ripple[]>([])
  const idRef = useRef(0)
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState<Mode>('pulse')
  const [auto, setAuto] = useState(true)
  const [speed, setSpeed] = useState(1)

  const drop = useCallback((x: number, y: number) => {
    ripplesRef.current.push({ x, y, t: performance.now(), id: ++idRef.current })
    if (ripplesRef.current.length > 28) ripplesRef.current.shift()
    setCount((c) => c + 1)
  }, [])

  const clear = useCallback(() => {
    ripplesRef.current = []
    setCount(0)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let running = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const seed = () => {
      drop(canvas.clientWidth * 0.5, canvas.clientHeight * 0.45)
    }
    seed()

    const intervalMs = Math.max(420, (mode === 'cascade' ? 900 : 1600) / speed)
    const interval = window.setInterval(() => {
      if (!auto) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (mode === 'pulse') {
        drop(w * (0.35 + Math.random() * 0.3), h * (0.3 + Math.random() * 0.3))
      } else if (mode === 'cascade') {
        for (let i = 0; i < 3; i++) {
          drop(w * (0.25 + i * 0.25), h * (0.35 + (i % 2) * 0.15))
        }
      } else {
        drop(w * (0.2 + Math.random() * 0.6), h * (0.25 + Math.random() * 0.45))
      }
    }, intervalMs)

    const draw = (now: number) => {
      if (!running) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(0,255,65,0.06)'
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 48) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += 48) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      const alive: Ripple[] = []
      for (const r of ripplesRef.current) {
        const age = (now - r.t) / 1000
        if (age > 2.4) continue
        alive.push(r)
        const maxR = mode === 'trace' ? 220 : 180
        const radius = age * maxR
        const alpha = Math.max(0, 1 - age / 2.4)
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,255,65,${alpha * 0.85})`
        ctx.lineWidth = 2
        ctx.stroke()
        if (mode !== 'pulse') {
          ctx.beginPath()
          ctx.arc(r.x, r.y, radius * 0.55, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0,255,65,${alpha * 0.35})`
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,65,${alpha})`
        ctx.fill()
      }
      ripplesRef.current = alive

      if (mode === 'trace' && alive.length >= 2) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(0,255,65,0.35)'
        ctx.lineWidth = 1.5
        alive.forEach((r, i) => {
          if (i === 0) ctx.moveTo(r.x, r.y)
          else ctx.lineTo(r.x, r.y)
        })
        ctx.stroke()
      }

      // HUD chips
      const chips =
        mode === 'pulse'
          ? ['AUTO PULSE', auto ? 'LIVE' : 'HOLD', `SPD ${speed.toFixed(1)}x`]
          : mode === 'cascade'
            ? ['CASCADE', 'MULTI-DROP', auto ? 'LIVE' : 'HOLD']
            : ['TRACE PATH', 'LINK WAKES', auto ? 'LIVE' : 'HOLD']
      ctx.font = '11px ui-monospace, monospace'
      chips.forEach((label, i) => {
        const x = 16
        const y = 24 + i * 22
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(x, y - 12, 118, 18)
        ctx.strokeStyle = 'rgba(0,255,65,0.4)'
        ctx.strokeRect(x, y - 12, 118, 18)
        ctx.fillStyle = ACCENT
        ctx.fillText(label, x + 8, y)
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [drop, mode, auto, speed])

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    drop(e.clientX - rect.left, e.clientY - rect.top)
  }

  return (
    <div className="min-h-screen flex flex-col bg-void">
      <header className="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: ACCENT }}>
            TrinityWayve · Module
          </p>
          <h1 className="text-xl font-bold tracking-tight">Ripple Wake Canvas</h1>
          <p className="text-xs text-white/50 mt-0.5">
            Signal propagation — drop pulses, watch cascade paths light up.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center font-mono text-[11px]">
          {(['pulse', 'cascade', 'trace'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="rounded border px-2.5 py-1 uppercase tracking-wider transition-colors"
              style={{
                borderColor: mode === m ? ACCENT : '#1a1a1a',
                background: mode === m ? 'rgba(0,255,65,0.12)' : 'transparent',
                color: mode === m ? ACCENT : 'rgba(255,255,255,0.55)',
              }}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            className="rounded border border-white/15 px-2.5 py-1 text-white/70 hover:bg-white/5"
          >
            {auto ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded border border-white/15 px-2.5 py-1 text-white/70 hover:bg-white/5"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-panel/80">
        <p className="font-mono text-[11px] text-white/55">
          Demo shell — click canvas to drop a wake ·{' '}
          <a
            href="https://trinitywayve-command-center.vercel.app/"
            className="underline underline-offset-2 hover:text-white"
            style={{ color: ACCENT }}
          >
            Open Command Center →
          </a>
        </p>
        <div className="flex items-center gap-2 font-mono text-[11px] text-white/45">
          <span>Speed</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24 accent-green-500"
            aria-label="Wake auto speed"
          />
          <span style={{ color: ACCENT }}>{speed.toFixed(1)}x</span>
        </div>
      </div>

      <main className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onPointerDown={onPointer}
        />
        <div className="absolute left-4 bottom-4 rounded-md border border-border bg-black/70 px-3 py-2 font-mono text-[11px] text-white/60 backdrop-blur">
          <div>
            Wakes: <span style={{ color: ACCENT }}>{count}</span>
          </div>
          <div className="text-white/35">Mode: {mode.toUpperCase()}</div>
          <div className="text-white/35">Click canvas to drop a signal</div>
        </div>
      </main>

      <nav className="border-t border-border px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-white/40">
        <span className="text-white/25 uppercase tracking-wider">Hubs</span>
        {HUBS.map((h) => (
          <a key={h.href} href={h.href} className="hover:text-white/80 transition-colors" style={{ color: 'inherit' }}>
            {h.label}
          </a>
        ))}
      </nav>

      <footer className="border-t border-border px-4 py-2 font-mono text-[9px] tracking-wide text-white/35 overflow-x-auto whitespace-nowrap">
        {FOOTER} | DEMO SHELL | RIPPLE WAKE
      </footer>
    </div>
  )
}
