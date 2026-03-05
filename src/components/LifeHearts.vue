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
import {computed} from 'vue'

const props = defineProps({
  current: {type: Number, default: 3},
  max: {type: Number, default: 3}
})

const current = computed(() => Math.max(0, Math.min(props.current ?? 0, props.max ?? 0)))
const max = computed(() => Math.max(0, props.max ?? 0))
</script>