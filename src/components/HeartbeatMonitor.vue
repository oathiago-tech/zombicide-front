<template>
  <div class="hb" :class="colorClass" role="img" aria-label="Heartbeat monitor">
    <svg class="hb__svg" viewBox="0 0 600 120" preserveAspectRatio="none">
      <!-- trilho/grade sutil -->
      <g class="hb__grid">
        <path d="M0 30 H600"/>
        <path d="M0 60 H600"/>
        <path d="M0 90 H600"/>
      </g>

      <!-- linha ECG (duplicada pra dar loop contínuo) -->
      <g class="hb__wave">
        <path :d="wavePath" pathLength="600"/>
        <path :d="wavePath2" pathLength="600"/>
      </g>
    </svg>
  </div>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  value: {type: Number, default: 0}
})

const colorClass = computed(() => {
  const v = props.value ?? 0
  if (v <= 6) return 'hb--blue'
  if (v <= 18) return 'hb--yellow'
  if (v <= 42) return 'hb--orange'
  return 'hb--red'
})

/**
 * Um traçado ECG simples. A ideia é só visual (clean), sem depender de libs.
 * Ele vai “andar” pro lado via stroke-dashoffset.
 */
const wavePath = 'M0 70 L60 70 L85 70 L100 40 L115 100 L130 65 L170 65 L200 65 L215 52 L230 85 L245 70 L300 70 L360 70 L385 70 L400 45 L415 102 L430 66 L470 66 L500 66 L515 54 L530 86 L545 70 L600 70'
const wavePath2 = 'M0 70 L60 70 L85 70 L100 40 L115 100 L130 65 L170 65 L200 65 L215 52 L230 85 L245 70 L300 70 L360 70 L385 70 L400 45 L415 102 L430 66 L470 66 L500 66 L515 54 L530 86 L545 70 L600 70'
</script>