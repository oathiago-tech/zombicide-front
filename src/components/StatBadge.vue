<template>
  <FramePanel>
    <template #title>
      <div class="titleRow">
        <h3 class="title">{{ title }}</h3>
        <div class="value">
          <slot name="value">
            <span class="muted">{{ life }}</span>
          </slot>
        </div>
      </div>
    </template>

    <div class="content">
      <slot>
        <LifeHearts :current="life" :max="maxLife"/>
      </slot>
    </div>
  </FramePanel>
</template>

<script setup>
import FramePanel from './FramePanel.vue'
import LifeHearts from '../components/LifeHearts.vue'

defineProps({
  title: {type: String, required: true}
})
</script>
