<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ColorBends from './ColorBends.vue'
import DotField from './DotField.vue'

const themes = {
  light: {
    background: '#f5f9ff',
    bendColors: ['#4da3ff'],
    bendIntensity: 1,
    bendOpacity: 0.28,
    bendNoise: 0,
    bendBandWidth: 2.8,
    normalizeBendColor: true,
    dotGradientFrom: 'rgba(67,141,234,0.35)',
    dotGradientTo: 'rgba(27,155,168,0.24)',
    glowColor: '#3b8eea',
    glowStrength: 0
  },
  dark: {
    background: '#060b1a',
    bendColors: ['#176bff'],
    bendIntensity: 1.3,
    bendOpacity: 1,
    bendNoise: 0.15,
    bendBandWidth: 3.5,
    normalizeBendColor: false,
    dotGradientFrom: 'rgba(103, 166, 255, 0.32)',
    dotGradientTo: 'rgba(55, 123, 234, 0.2)',
    glowColor: '#176bff',
    glowStrength: 0.22
  }
}

const getThemeMode = () => (
  document.documentElement.getAttribute('theme-mode') === 'dark' ? 'dark' : 'light'
)

const themeMode = ref(getThemeMode())
const theme = computed(() => themes[themeMode.value])
let themeObserver

onMounted(() => {
  themeMode.value = getThemeMode()
  themeObserver = new MutationObserver(() => {
    themeMode.value = getThemeMode()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['theme-mode']
  })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = undefined
})
</script>

<template>
  <div
    class="vue-bits-background"
    :style="{ '--vue-bits-background': theme.background }"
    aria-hidden="true"
  >
    <div class="vue-bits-background__layer vue-bits-background__color">
      <ColorBends
        :colors="theme.bendColors"
        :speed="0.2"
        :frequency="1"
        :noise="theme.bendNoise"
        :band-width="theme.bendBandWidth"
        :rotation="90"
        :fade-top="0.75"
        :iterations="1"
        :intensity="theme.bendIntensity"
        :opacity="theme.bendOpacity"
        :normalize-transparent-color="theme.normalizeBendColor"
        transparent
      />
    </div>

    <div class="vue-bits-background__layer vue-bits-background__dots">
      <DotField
        :dot-radius="2"
        :dot-spacing="14"
        :cursor-radius="500"
        :cursor-force="0.1"
        bulge-only
        :bulge-strength="67"
        :glow-radius="160"
        :sparkle="false"
        :wave-amplitude="0"
        :gradient-from="theme.dotGradientFrom"
        :gradient-to="theme.dotGradientTo"
        :glow-color="theme.glowColor"
        :glow-strength="theme.glowStrength"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.vue-bits-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: var(--vue-bits-background);
  transition: background-color 0.35s ease;
}

.vue-bits-background__layer {
  position: absolute;
  inset: 0;
}

.vue-bits-background__color {
  z-index: 0;
}

.vue-bits-background__dots {
  z-index: 1;
  pointer-events: none;
}
</style>
