<template>
  <section class="panel">
    <header v-if="$slots.title" class="panel__header">
      <slot name="title" />
    </header>

    <div class="panel__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.panel{
  border-radius: var(--radius);
  border: 3px solid var(--stroke);
  background:
      radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,.16), rgba(255,255,255,0) 45%),
      linear-gradient(180deg, var(--panel), var(--panel2));
  box-shadow:
      0 0 0 2px rgba(255,255,255,.06) inset,
      0 18px 35px rgba(0,0,0,.60);
  overflow: hidden;
}

.panel__header{
  padding: 16px 18px 10px;
  border-bottom: 2px solid rgba(0,0,0,.55);
  box-shadow: 0 -1px 0 rgba(255,255,255,.08) inset;
}

.panel__body{
  padding: 16px 18px 18px;
}
</style>