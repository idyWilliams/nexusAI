<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  export let onExit: () => void

  let canvas: HTMLCanvasElement
  let raf = 0
  let canvasBroken = false
  const circles: Array<{ x: number; y: number; r: number; life: number }> = []

  function resize() {
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
    canvas.width = w
    canvas.height = h
  }

  function spawn(x: number, y: number) {
    circles.push({ x, y, r: 6, life: 1 })
  }

  function loop() {
    if (canvasBroken || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      canvasBroken = true
      return
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--nx-bg') || '#0f1114'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const c of circles) {
      c.life -= 0.008
      c.r += 0.35
      const alpha = Math.max(0, Math.min(1, c.life))
      ctx.beginPath()
      ctx.strokeStyle = `rgba(124, 158, 178, ${alpha * 0.55})`
      ctx.lineWidth = 2
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let i = circles.length - 1; i >= 0; i--) {
      if (circles[i].life <= 0) circles.splice(i, 1)
    }
    raf = requestAnimationFrame(loop)
  }

  function onPointer(e: PointerEvent) {
    if (canvasBroken || !canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const dpr = canvas.width / rect.width
    spawn((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr)
  }

  onMount(() => {
    try {
      resize()
      window.addEventListener('resize', resize)
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) {
        canvasBroken = true
        return
      }
      raf = requestAnimationFrame(loop)
    } catch {
      canvasBroken = true
    }
  })

  onDestroy(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  })
</script>

<div class="wrap">
  <header class="top">
    <div>
      <p class="eyebrow">Recovery</p>
      <h3 class="title">Calm circles</h3>
      {#if canvasBroken}
        <p class="sub">This surface couldn’t start cleanly — you can still return to NEXUS.</p>
      {:else}
        <p class="sub">Tap gently. Nothing to win. Exit anytime.</p>
      {/if}
    </div>
    <button type="button" class="exit" on:click={onExit}>Back to NEXUS</button>
  </header>
  {#if !canvasBroken}
    <canvas
      bind:this={canvas}
      class="canvas"
      on:pointerdown={onPointer}
      aria-label="Calm circles canvas"
    />
  {/if}
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: min(52vh, 420px);
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }
  .eyebrow {
    margin: 0;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--nx-fg-muted);
  }
  .title {
    margin: 0.15rem 0 0.15rem;
    font-size: 1rem;
    font-weight: 600;
  }
  .sub {
    margin: 0;
    font-size: 0.88rem;
    color: var(--nx-fg-muted);
    line-height: 1.35;
  }
  .exit {
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    background: color-mix(in oklab, var(--nx-accent) 16%, transparent);
    color: var(--nx-fg);
    padding: 0.45rem 0.75rem;
    flex-shrink: 0;
  }
  .canvas {
    flex: 1;
    width: 100%;
    min-height: 160px;
    border-radius: 14px;
    border: 1px solid var(--nx-line);
    touch-action: none;
    background: var(--nx-bg);
  }
</style>
