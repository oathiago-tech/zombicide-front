<template>
  <div class="zombieHud">
    <div class="frame-title frame-title--nav">
      <span class="frame-title__text">ZOMBIES</span>

      <button
          class="navBtn"
          type="button"
          @click="$emit('next')"
          aria-label="Next turn"
          :disabled="turning"
      >
        &gt;
      </button>
    </div>

    <div class="frame-subtitle">
      <span class="namePlaceholder">AMOUNT: {{ totalZombies }}</span>
    </div>

    <div class="hud-grid">
      <FramePanel>
        <template #title>
          <div class="zTitle">
            <h2>Zombies</h2>
          </div>
        </template>

        <div class="zBody">
          <div class="zHero">
            <img class="zHero__img" src="/images/zombies/abomination.webp" alt="Abomination" />
          </div>
        </div>
      </FramePanel>

      <FramePanel>
        <template #title>
          <div class="zTitle">
            <h2>Players</h2>
          </div>
        </template>

        <div class="playersList">
          <div v-for="p in players" :key="p.id" class="pRow">
            <div class="pLeft">
              <div class="pName">{{ p.playerName }}</div>
              <div class="pMeta muted">{{ p.characterName }}</div>
            </div>

            <div class="pMid">
              <LifeHearts :current="p.life ?? 0" :max="3" />
            </div>

            <div class="pRight">
              <button class="btnDamage" type="button" @click="$emit('damage', p.id)" :disabled="turning">
                Damage
              </button>

              <button class="btnDamageRevert" type="button" @click="$emit('revert', p.id)" :disabled="turning">
                Revert
              </button>
            </div>
          </div>

          <div v-if="players.length === 0" class="empty">
            Nenhum jogador na partida.
          </div>
        </div>
      </FramePanel>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FramePanel from '../components/FramePanel.vue'
import LifeHearts from '../components/LifeHearts.vue'

defineEmits(['damage', 'revert', 'next'])

const props = defineProps({
  players: { type: Array, default: () => [] },
  turnPhase: { type: String, default: '' },
  turning: { type: Boolean, default: false },
  zombies: { type: Object, default: null }
})

const zCounts = computed(() => {
  const z = props.zombies && typeof props.zombies === 'object' ? props.zombies : {}
  return {
    walkers: Number(z.walkers ?? 0) || 0,
    runners: Number(z.runners ?? 0) || 0,
    fatties: Number(z.fatties ?? 0) || 0,
    abomination: Number(z.abomination ?? 0) || 0
  }
})

const totalZombies = computed(() => {
  return zCounts.value.walkers + zCounts.value.runners + zCounts.value.fatties + zCounts.value.abomination
})
</script>

<style scoped>
/* Faz a tela do HUD ocupar a altura total da viewport (desktop) */
.container{
  min-height: calc(100vh - 36px); /* 18px top + 18px bottom (margin do .container) */
  display: flex;
  flex-direction: column;
}

/* Deixa o grid crescer até encostar no final da página */
.hud-grid{
  flex: 1;
  min-height: 0; /* importante pra evitar overflow estranho em flex */
}

/* Garante que cada coluna/painel estique a altura do grid */
.hud-grid > *{
  height: 100%;
}

/* Faz o FramePanel preencher a altura disponível (apenas dentro do GameHud) */
:deep(.panel){
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.panel__body){
  flex: 1;
  min-height: 0;
}

/* Mobile: não força “full height” (fica natural e scrollável) */
@media (max-width: 1100px){
  .container{
    min-height: auto;
    display: block;
  }
  .hud-grid{
    flex: none;
    min-height: auto;
  }
  .hud-grid > *{
    height: auto;
  }
  :deep(.panel){
    height: auto;
  }
  :deep(.panel__body){
    min-height: auto;
  }
}
.zombieHud{
  display: grid;
  gap: 10px;
}

.namePlaceholder{
  opacity: .95;
}

.frame-title--nav{
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px;
  align-items: center;
  gap: 12px;
}

.frame-title__text{
  justify-self: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(28px, 6vw, 54px);
  line-height: 1;
}

@media (max-width: 620px){
  .frame-title{
    padding: 14px 12px 12px;
  }
  .frame-title--nav{
    grid-template-columns: minmax(0, 1fr) 46px;
    gap: 10px;
  }
  .navBtn{
    width: 46px;
  }
}

.navBtn{
  height: 44px;
  width: 56px;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,.65);
  background: rgba(0,0,0,.22);
  color: rgba(255,255,255,.92);
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(255,255,255,.06) inset;
}

.navBtn:active{
  transform: translateY(1px);
}

.navBtn:disabled{
  opacity: .45;
  cursor: not-allowed;
}

.zTitle{
  display: flex;
  align-items: center;
  justify-content: center;
}

.zTitle h2{
  font-size: 54px;
}

.zBody{
  display: grid;
  gap: 10px;
  text-align: center;
}

/* Igual ao quadrante do personagem (HUD de player) */
.zHero{
  padding: 14px;

  width: 100%;
  aspect-ratio: 3 / 4;
  min-height: 260px;

  display: grid;
  place-items: center;

  overflow: hidden;

  position: relative;
  isolation: isolate;

  border-radius: 14px;
  background: none;
}

.pRight{
  display: flex;
  gap: 20px;
  align-items: center;
}

.zHero::before{
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;

  background-image:
      linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.65)),
      url("/images/others/dangerZone.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  border-radius: inherit;
  opacity: 0.25;
}

.zHero__img{
  position: relative;
  z-index: 1;

  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;

  object-fit: contain;
  object-position: center bottom;
  display: block;

  filter: drop-shadow(0 10px 20px rgba(0,0,0,.55));
}

@media (max-width: 1100px){
  .zHero{
    min-height: 420px;
    aspect-ratio: 3 / 4;
  }
}

.playersList{
  display: grid;
  gap: 10px;
}

.pRow{
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,.70);
  background:
      radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,.12), rgba(255,255,255,0) 46%),
      linear-gradient(180deg, #7a0015, #260008);
  box-shadow: 0 0 0 2px rgba(255,255,255,.05) inset;

  padding: 12px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
}

.pName{
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 26px;
  line-height: 1;
}

.pMeta{
  margin-top: 4px;
  font-weight: 700;
  letter-spacing: .03em;
  text-transform: uppercase;
  font-size: 12px;
}

.pMid{
  min-width: 140px;
  display: grid;
  justify-items: center;
}

.btnDamage{
   height: 44px;
   min-width: 120px;
   padding: 0 14px;
   border-radius: 10px;
   border: 0;
   cursor: pointer;
   font-weight: 900;
   letter-spacing: .02em;
   color: white;
   box-shadow: 0 0 0 3px rgba(0, 0, 0, .55);
   background: linear-gradient(#c9132b, #650013);
   font-family: "Bebas Neue", system-ui, sans-serif;
   font-size: 28px;
 }

.btnDamage:disabled{
  opacity: .5;
  cursor: not-allowed;
}

.btnDamageRevert{
  height: 44px;
  min-width: 120px;
  padding: 0 14px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: .02em;
  color: white;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, .55);
  background: linear-gradient(#13c9b4, #0CD8D8FF);
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 28px;
}

.btnDamageRevert:disabled{
  opacity: .5;
  cursor: not-allowed;
}
.muted{ color: var(--muted); }

@media (max-width: 700px){
  .pRow{
    grid-template-columns: 1fr;
    justify-items: stretch;
  }
  .pMid{
    justify-items: start;
  }
}
</style>