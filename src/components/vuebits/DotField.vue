<template>
  <div ref="root" class="dot-field" :class="className">
    <canvas ref="canvas" class="dot-field__canvas" />

    <svg class="dot-field__glow" aria-hidden="true">
      <defs>
        <radialGradient :id="glowId">
          <stop
            offset="0%"
            :stop-color="glowColor"
            :stop-opacity="normalizedGlowStrength"
          />
          <stop offset="100%" :stop-color="glowColor" stop-opacity="0" />
        </radialGradient>
      </defs>

      <circle
        ref="glowEl"
        cx="-9999"
        cy="-9999"
        :r="glowRadius"
        :fill="`url(#${glowId})`"
        style="opacity: 0; will-change: opacity"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const TWO_PI = Math.PI * 2

const props = defineProps({
  dotRadius: { type: Number, default: 1.5 },
  dotSpacing: { type: Number, default: 14 },
  cursorRadius: { type: Number, default: 500 },
  cursorForce: { type: Number, default: 0.1 },
  bulgeOnly: { type: Boolean, default: true },
  bulgeStrength: { type: Number, default: 67 },
  glowRadius: { type: Number, default: 160 },
  sparkle: { type: Boolean, default: false },
  waveAmplitude: { type: Number, default: 0 },
  gradientFrom: { type: String, default: 'rgba(124, 255, 103, 0.35)' },
  gradientTo: { type: String, default: 'rgba(160, 255, 188, 0.25)' },
  glowColor: { type: String, default: '#14110E' },
  glowStrength: { type: Number, default: 1 },
  className: { type: String, default: '' }
})

const normalizedGlowStrength = computed(() => (
  Math.max(0, Math.min(props.glowStrength, 1))
))

const root = ref(null)
const canvas = ref(null)
const glowEl = ref(null)
const glowId = `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`

let dots = []
const mouse = {
  x: -9999,
  y: -9999,
  prevX: -9999,
  prevY: -9999,
  speed: 0
}

let size = {
  w: 0,
  h: 0,
  offsetX: 0,
  offsetY: 0
}

let glowOpacity = 0
let engagement = 0
let raf = 0
let resizeTimer
let speedInterval
let frameCount = 0
let removeListeners = null

function buildDots(w, h) {
  const step = Math.max(props.dotRadius + props.dotSpacing, 1)
  const cols = Math.floor(w / step)
  const rows = Math.floor(h / step)
  const padX = (w % step) / 2
  const padY = (h % step) / 2
  const nextDots = new Array(rows * cols)
  let index = 0

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const ax = padX + col * step + step / 2
      const ay = padY + row * step + step / 2
      nextDots[index] = {
        ax,
        ay,
        sx: ax,
        sy: ay,
        vx: 0,
        vy: 0,
        x: ax,
        y: ay
      }
      index += 1
    }
  }

  dots = nextDots
}

function updateMouseSpeed() {
  const dx = mouse.prevX - mouse.x
  const dy = mouse.prevY - mouse.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  mouse.speed += (distance - mouse.speed) * 0.5
  if (mouse.speed < 0.001) mouse.speed = 0

  mouse.prevX = mouse.x
  mouse.prevY = mouse.y
}

function setupCanvas() {
  if (!root.value || !canvas.value) return

  const rootElement = root.value
  const canvasElement = canvas.value
  const context = canvasElement.getContext('2d', { alpha: true })
  if (!context) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  function doResize() {
    const rect = rootElement.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvasElement.width = Math.max(Math.round(width * dpr), 1)
    canvasElement.height = Math.max(Math.round(height * dpr), 1)
    canvasElement.style.width = `${width}px`
    canvasElement.style.height = `${height}px`
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    size = {
      w: width,
      h: height,
      offsetX: rect.left + window.scrollX,
      offsetY: rect.top + window.scrollY
    }
    buildDots(width, height)
  }

  function resize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(doResize, 100)
  }

  function onMouseMove(event) {
    mouse.x = event.pageX - size.offsetX
    mouse.y = event.pageY - size.offsetY
  }

  function tick() {
    frameCount += 1

    const { w, h } = size
    const time = frameCount * 0.02
    const targetEngagement = Math.min(mouse.speed / 5, 1)

    engagement += (targetEngagement - engagement) * 0.06
    if (engagement < 0.001) engagement = 0
    glowOpacity += (engagement - glowOpacity) * 0.08

    if (glowEl.value) {
      glowEl.value.setAttribute('cx', String(mouse.x))
      glowEl.value.setAttribute('cy', String(mouse.y))
      glowEl.value.style.opacity = String(glowOpacity)
    }

    context.clearRect(0, 0, w, h)

    const gradient = context.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, props.gradientFrom)
    gradient.addColorStop(1, props.gradientTo)
    context.fillStyle = gradient

    const cursorRadiusSquared = props.cursorRadius * props.cursorRadius
    const radius = props.dotRadius / 2

    context.beginPath()

    for (let index = 0; index < dots.length; index += 1) {
      const dot = dots[index]
      const dx = mouse.x - dot.ax
      const dy = mouse.y - dot.ay
      const distanceSquared = dx * dx + dy * dy

      if (distanceSquared < cursorRadiusSquared && engagement > 0.01) {
        const distance = Math.sqrt(distanceSquared)
        const angle = Math.atan2(dy, dx)

        if (props.bulgeOnly) {
          const falloff = 1 - distance / props.cursorRadius
          const push = falloff * falloff * props.bulgeStrength * engagement
          dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15
          dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15
        } else {
          const safeDistance = Math.max(distance, 0.001)
          const move = (500 / safeDistance) * (mouse.speed * props.cursorForce)
          dot.vx -= Math.cos(angle) * move
          dot.vy -= Math.sin(angle) * move
        }
      } else if (props.bulgeOnly) {
        dot.sx += (dot.ax - dot.sx) * 0.1
        dot.sy += (dot.ay - dot.sy) * 0.1
      }

      if (!props.bulgeOnly) {
        dot.vx *= 0.9
        dot.vy *= 0.9
        dot.x = dot.ax + dot.vx
        dot.y = dot.ay + dot.vy
        dot.sx += (dot.x - dot.sx) * 0.1
        dot.sy += (dot.y - dot.sy) * 0.1
      }

      let drawX = dot.sx
      let drawY = dot.sy

      if (props.waveAmplitude > 0) {
        drawY += Math.sin(dot.ax * 0.03 + time) * props.waveAmplitude
        drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * props.waveAmplitude * 0.5
      }

      const sparkles = props.sparkle
        && (((index * 2654435761) ^ (frameCount >> 3)) >>> 0) % 100 < 3
      const drawRadius = sparkles ? radius * 1.8 : radius

      context.moveTo(drawX + drawRadius, drawY)
      context.arc(drawX, drawY, drawRadius, 0, TWO_PI)
    }

    context.fill()
    raf = requestAnimationFrame(tick)
  }

  doResize()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  speedInterval = setInterval(updateMouseSpeed, 20)
  raf = requestAnimationFrame(tick)

  removeListeners = () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMouseMove)
  }
}

function cleanup() {
  cancelAnimationFrame(raf)
  clearInterval(speedInterval)
  clearTimeout(resizeTimer)
  removeListeners?.()
  removeListeners = null
}

watch(
  () => [props.dotRadius, props.dotSpacing],
  async () => {
    await nextTick()
    if (size.w > 0 && size.h > 0) buildDots(size.w, size.h)
  }
)

onMounted(setupCanvas)
onBeforeUnmount(cleanup)
</script>

<style scoped lang="scss">
.dot-field {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dot-field__canvas,
.dot-field__glow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.dot-field__glow {
  pointer-events: none;
}
</style>
