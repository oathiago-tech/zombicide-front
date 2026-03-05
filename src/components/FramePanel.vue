<template>
  <section class="panel">
    <header v-if="$slots.title" class="panel__header">
      <slot name="title"/>
    </header>

    <div class="panel__body">
      <slot/>
    </div>
  </section>
</template>