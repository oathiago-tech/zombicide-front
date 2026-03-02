<template>
  <div class="hb" :class="colorClass" role="img" aria-label="Heartbeat monitor">
    <svg class="hb__svg" viewBox="0 0 600 120" preserveAspectRatio="none">
      <!-- trilho/grade sutil -->
      <g class="hb__grid">
        <path d="M0 30 H600" />
        <path d="M0 60 H600" />
        <path d="M0 90 H600" />
      </g>

      <!-- linha ECG (duplicada pra dar loop contínuo) -->
      <g class="hb__wave">
        <path :d="wavePath" pathLength="600" />
        <path :d="wavePath2" pathLength="600" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 }
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

<style scoped>
.hb{
  height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
  overflow: hidden;
  box-shadow: 0 0 0 2px rgba(0,0,0,.35) inset;
}

.hb__svg{
  width: 100%;
  height: 100%;
  display: block;
}

.hb__grid path{
  stroke: rgba(255,255,255,.06);
  stroke-width: 1;
}

.hb__wave path{
  fill: none;
  stroke: currentColor;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;

  stroke-dasharray: 300 300;
  animation: hb-move 1.35s linear infinite;
  filter: drop-shadow(0 0 6px rgba(255,255,255,.14));
}

/* segunda linha começa “adiantada” pra ficar contínuo */
.hb__wave path:nth-child(2){
  animation-delay: -0.675s;
  opacity: .85;
}

@keyframes hb-move{
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -600; }
}

/* Cores por faixa */
.hb--blue{   color: #2f89ff; }
.hb--yellow{ color: #f0c24a; }
.hb--orange{ color: #ff8b2f; }
.hb--red{    color: #ff3b3b; }
</style>