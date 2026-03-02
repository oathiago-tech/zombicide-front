<template>
  <div class="hearts" :aria-label="`Life: ${current}/${max}`" role="img">
    <span
        v-for="i in max"
        :key="i"
        class="heart"
        :class="{ 'heart--on': i <= current }"
        aria-hidden="true"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, default: 3 },
  max: { type: Number, default: 3 }
})

const current = computed(() => Math.max(0, Math.min(props.current ?? 0, props.max ?? 0)))
const max = computed(() => Math.max(0, props.max ?? 0))
</script>

<style scoped>
.hearts{
  display: inline-flex;
  align-items: center;
  gap: 20px;
}

/* Coração em CSS (clean e leve) */
.heart{
  width: 18px;
  height: 18px;
  position: relative;
  transform: rotate(-45deg);
  background: rgba(255,255,255,.18);
  border-radius: 4px 0 4px 4px;
  box-shadow: 0 0 0 2px rgba(0,0,0,.35);
}

.heart::before,
.heart::after{
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  background: inherit;
  border-radius: 50%;
}

.heart::before{
  top: -9px;
  left: 0;
}

.heart::after{
  left: 9px;
  top: 0;
}

.heart--on{
  background: linear-gradient(#ff4b4b, #b10018);
  box-shadow:
      0 0 0 2px rgba(0,0,0,.35),
      0 0 10px rgba(255,60,60,.25);
}
</style>