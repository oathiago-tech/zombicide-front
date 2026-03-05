<template>
  <div class="enemy">
    <div class="enemy__left">
      <div class="enemy__thumb" aria-hidden="true">
        <img
            v-if="imageSrc"
            class="enemy__img"
            :src="imageSrc"
            :alt="`${name} image`"
        />
      </div>
    </div>

    <div class="enemy__mid">
      <div class="enemy__name">{{ name }}: <span>{{ many ?? '0' }}</span></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {type: String, required: true},
  many: {type: [Number, String], default: null},
  imageSrc: {type: String, default: ''}
})
</script>