<template>
  <div class="container">
    <div class="frame-title frame-title--nav">
      <button class="navBtn" type="button" @click="prevPlayer" aria-label="Previous player">
        &lt;
      </button>

      <span class="frame-title__text">{{ currentPlayer.playerName }}</span>

      <button class="navBtn" type="button" @click="nextPlayer" aria-label="Next player">
        &gt;
      </button>
    </div>

    <div class="frame-subtitle">
      <span class="namePlaceholder">{{ currentPlayer.characterName }}</span>
    </div>

    <div class="hud-grid">
      <FramePanel>
        <div class="placeholder placeholder--character">
          <img
              class="character__img"
              :src="currentPlayer.characterImg"
              :alt="currentPlayer.characterName"
          />
        </div>

      </FramePanel>
      <div class="center">
        <div class="center__top">
          <StatBadge title="HEARTS / HP">
            <template #value>
              <span class="muted">{{ life }}</span>
            </template>

            <div class="muted small">
              <span><LifeHearts :current="life" :max="maxLife" /></span>
            </div>

          </StatBadge>

          <StatBadge title="Level">
            <template #value>
              <span class="levelValue">{{ level }}</span>
            </template>
            <HeartbeatMonitor :value="level" />
          </StatBadge>
        </div>

        <div class="center__bottom">
          <FramePanel>
            <div class="placeholder card">Item / Weapon 1</div>
          </FramePanel>

          <FramePanel>
            <div class="placeholder card">Item / Weapon 2</div>
          </FramePanel>
        </div>
      </div>

      <FramePanel>
        <template #title>
          <div class="enemiesTitle">
            <h2>Enemies</h2>
          </div>
        </template>

        <div class="enemiesList">
          <EnemyItem name="Walkers" :many="0" image-src="/images/zombies/walker.webp" />
          <EnemyItem name="Runners" :many="0" image-src="/images/zombies/runner.webp" />
          <EnemyItem name="Fatties" :many="0" image-src="/images/zombies/fatty.webp" />
          <EnemyItem name="Abomination" :many="0" image-src="/images/zombies/abomination.webp" />
        </div>
      </FramePanel>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import FramePanel from '../components/FramePanel.vue'
import StatBadge from '../components/StatBadge.vue'
import EnemyItem from '../components/EnemyItem.vue'
import HeartbeatMonitor from '../components/HeartbeatMonitor.vue'
import LifeHearts from '../components/LifeHearts.vue'

const players = [
  { playerName: 'Player 1', characterName: 'Amy', characterImg: '/images/players/amy.webp' },
  { playerName: 'Player 2', characterName: 'Doug', characterImg: '/images/players/doug.webp' },
  { playerName: 'Player 3', characterName: 'Josh', characterImg: '/images/players/josh.webp' },
  { playerName: 'Player 4', characterName: 'Ned', characterImg: '/images/players/ned.webp' },
  { playerName: 'Player 5', characterName: 'Phil', characterImg: '/images/players/phil.webp' },
  { playerName: 'Player 6', characterName: 'Wanda', characterImg: '/images/players/wanda.png' }
]

const currentPlayerIndex = ref(0)
const currentPlayer = computed(() => players[currentPlayerIndex.value] ?? players[0])

function prevPlayer() {
  currentPlayerIndex.value = (currentPlayerIndex.value - 1 + players.length) % players.length
}

function nextPlayer() {
  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.length
}

/**
 * Estado do jogo (por enquanto local).
 * Quando ligar no endpoint, basta atualizar essas refs.
 */
const maxLife = ref(3)
const life = ref(3)
const level = ref(0)
</script>

<style scoped>
.namePlaceholder{
  opacity: .95;
}

/* topo com navegação */
.frame-title--nav{
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 56px;
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

@media (max-width: 420px){
  .frame-title{
    padding: 14px 12px 12px;
  }
  .navBtn{
    width: 46px;
  }
  .frame-title--nav{
    grid-template-columns: 46px minmax(0, 1fr) 46px;
    gap: 10px;
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

/* Character: tamanho estável + fundo dangerZone dentro do quadrante */
.placeholder--character{
  padding: 14px;

  width: 100%;
  aspect-ratio: 3 / 4;
  min-height: 560px;

  display: grid;
  place-items: center;

  overflow: hidden;

  position: relative;
  isolation: isolate;

  border-radius: 14px;
  background: none;
}

.placeholder--character::before{
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

.character__img{
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
  .placeholder--character{
    min-height: 420px;
    aspect-ratio: 3 / 4;
  }
}

/* center */
.center{
  display: grid;
  gap: 12px;
  grid-template-rows: auto 1fr;
}

.center__top{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 1100px){
  .center__top{
    grid-template-columns: 1fr;
  }
}

.center__bottom{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 700px){
  .center__bottom{
    grid-template-columns: 1fr;
  }
}

.card{
  min-height: 360px;
}

/* enemies */
.enemiesTitle{
  display: flex;
  align-items: center;
  justify-content: center;
}
.enemiesTitle h2{
  font-size: 54px;
}

.enemiesList{
  display: grid;
  gap: 12px;
}

.muted{ color: var(--muted); }

.small{
  font-size: 12px;
  font-weight: 300;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.levelValue{
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 36px;
  line-height: 1;
  color: rgba(255,255,255,.92);
  text-shadow: 0 2px 0 rgba(0,0,0,.45);
}
</style>