<template>
  <FramePanel>
    <template #title>
      <div class="titleRow">
        <h3 class="title">{{ title }}</h3>
        <div class="value">
          <slot name="value">
            <span class="muted">{{life}}</span>
          </slot>
        </div>
      </div>
    </template>

    <div class="content">
      <slot>
        <LifeHearts :current="life" :max="maxLife" />
      </slot>
    </div>
  </FramePanel>
</template>

<script setup>
import FramePanel from './FramePanel.vue'
import LifeHearts from '../components/LifeHearts.vue'

defineProps({
  title: { type: String, required: true }
})
</script>

<style scoped>
.titleRow{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap: 12px;
}
.title{
  font-size: 40px;
}
.value{
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 34px;
  opacity: .95;
}
.muted{ color: var(--muted); }
.small{ font-size: 12px; }
.content{
  padding-top: 6px;
}
</style>