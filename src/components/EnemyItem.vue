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

    <div class="enemy__right">
      <button class="enemy__btn" type="button">
        Kill
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  many: { type: [Number, String], default: null },
  imageSrc: { type: String, default: '' }
})
</script>

<style scoped>
.enemy{
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;

  width: 100%;
  min-width: 0;

  padding: 14px 14px;
  border-radius: var(--radius);
  border: 1px solid rgba(0,0,0,.75);
  background:
      radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,.14), rgba(255,255,255,0) 46%),
      linear-gradient(180deg, #7a0015, #260008);
  box-shadow: 0 0 0 2px rgba(255,255,255,.06) inset;
}

.enemy__left{
  min-width: 0;
}

.enemy__mid{
  min-width: 0;
}

.enemy__thumb{
  width: 72px;
  height: 72px;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.25);
  overflow: hidden;

  display: grid;
  place-items: center;
}

.enemy__img{
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.enemy__name{
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 20px;
  line-height: 1;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enemy__meta{
  margin-top: 6px;
  color: rgba(255,255,255,.85);
  font-weight: 700;
  text-align: center;
}

.enemy__many{
  display: inline-block;
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 26px;
  margin-left: 0;
}

.enemy__right{
  display:flex;
  align-items:center;
  justify-content: flex-end;
  gap: 14px;
  min-width: 0;
}

.enemy__check{
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #0c7a4f;
  box-shadow: 0 0 0 3px rgba(0,0,0,.55);
  position: relative;
  flex: 0 0 auto;
}

.enemy__check::after{
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 14px;
  height: 8px;
  border-left: 2px solid #fff;
  border-bottom: 4px solid #fff;
  transform: rotate(-45deg);
}

.enemy__btn{
  min-width: 120px;
  padding: 0 18px;
  height: 44px;
  border-radius: 10px;
  border: 0;
  color: white;
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 28px;
  letter-spacing: .03em;
  background: linear-gradient(#0f64cf, var(--blue));
  box-shadow: 0 0 0 3px rgba(0,0,0,.55);
  cursor: pointer;
  flex: 0 0 auto;
}

.enemy__btn:active{
  transform: translateY(1px);
}

/* Em larguras menores, deixa o botão quebrar sem cortar */
@media (max-width: 520px){
  .enemy{
    grid-template-columns: 72px minmax(0, 1fr);
    grid-template-areas:
      "thumb mid"
      "thumb right";
  }
  .enemy__left{ grid-area: thumb; }
  .enemy__mid{ grid-area: mid; }
  .enemy__right{
    grid-area: right;
    justify-content: flex-start;
    padding-top: 6px;
  }
}
</style>