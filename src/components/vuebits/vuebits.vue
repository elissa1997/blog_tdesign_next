<script setup>
import ColorBends from './ColorBends.vue'
</script>

<template>
  <div class="bg">
    <ColorBends
        :colors="['#27ff64']"
        :rotation="90"
        :speed="0.2"
        :scale="1"
        :frequency="1"
        :warp-strength="1"
        :mouse-influence="1"
        :noise="0.15"
        :parallax="0.5"
        :iterations="1"
        :intensity="1.5"
        :band-width="6"
        transparent
    />
  </div>
</template>

<style scoped lang="scss">
.bg {
  background-color: #0b0b0b;
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}
</style>
