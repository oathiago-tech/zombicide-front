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
      <!-- ESQUERDA: personagem (placeholder) -->
      <FramePanel>
        <div class="placeholder placeholder--character">
          <img class="character__img" :src="currentPlayer.characterImg" :alt="currentPlayer.characterName" />
        </div>
      </FramePanel>

      <!-- MEIO: status + “cartas/equipamentos” -->
      <div class="center">
        <div class="center__top">
          <StatBadge title="Life">
            <template #value>
              <span class="muted">{{ life }}</span>
            </template>

            <LifeHearts :current="life" :max="maxLife" />
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

      <!-- DIREITA: enemies -->
      <FramePanel>
        <template #title>
          <div class="enemiesTitle">
            <h2>Enemies</h2>
          </div>
        </template>

        <div class="enemiesList">
          <EnemyItem name="Walkers" :many="null" :image-src="walkerImg" />
          <EnemyItem name="Runners" :many="null" :image-src="runnerImg" />
          <EnemyItem name="Fatties" :many="null" :image-src="fattyImg" />
          <EnemyItem name="Abomination" :many="null" :image-src="abominationImg" />
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

import amyImg from '../../public/images/players/amy.webp'
import dougImg from '../../public/images/players/doug.webp'
import joshImg from '../../public/images/players/josh.webp'
import nedImg from '../../public/images/players/ned.webp'
import philImg from '../../public/images/players/phil.webp'
import wandaImg from '../../public/images/players/wanda.png'

import abominationImg from '../../public/images/zombies/abomination.webp'
import fattyImg from '../../public/images/zombies/fatty.webp'
import runnerImg from '../../public/images/zombies/runner.webp'
import walkerImg from '../../public/images/zombies/walker.webp'

const players = [
  { playerName: 'Thiago', characterName: 'Amy', characterImg: amyImg },
  { playerName: 'Player 2', characterName: 'Doug', characterImg: dougImg },
  { playerName: 'Player 3', characterName: 'Josh', characterImg: joshImg },
  { playerName: 'Player 4', characterName: 'Ned', characterImg: nedImg },
  { playerName: 'Player 5', characterName: 'Phil', characterImg: philImg },
  { playerName: 'Player 6', characterName: 'Wanda', characterImg: wandaImg }
]

const currentPlayerIndex = ref(0)

const currentPlayer = computed(() => players[currentPlayerIndex.value] ?? players[0])

function prevPlayer() {
  currentPlayerIndex.value =
      (currentPlayerIndex.value - 1 + players.length) % players.length
}

function nextPlayer() {
  currentPlayerIndex.value =
      (currentPlayerIndex.value + 1) % players.length
}

const maxLife = ref(3)
const life = ref(3)
const level = ref(0)

defineProps({
  playerName: { type: String, default: '' },
  characterName: { type: String, default: '' }
})
</script>

<style scoped>
.namePlaceholder{
  opacity: .95;
}

.frame-title--nav{
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 56px;
  align-items: center;
  gap: 12px;
}

.frame-title__text{
  justify-self: center;

  /* não quebra linha no iPhone */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* reduz automaticamente conforme a largura */
  font-size: clamp(28px, 6vw, 54px);
  line-height: 1;
}

/* Se quiser apertar ainda mais em telas bem pequenas */
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

.placeholder--character{
  padding: 14px;

  /* Garante que o quadro do personagem tenha tamanho fixo e não mude com a imagem */
  width: 100%;
  aspect-ratio: 3 / 4;
  min-height: 560px;

  display: grid;
  place-items: center;

  overflow: hidden;
}

.character__img{
  /* Padroniza o “tamanho percebido” das imagens */
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;

  object-fit: contain;          /* não corta; mantém a imagem inteira */
  object-position: center bottom;
  display: block;
}

/* Em telas menores, reduz o quadro pra não estourar */
@media (max-width: 1100px){
  .placeholder--character{
    min-height: 420px;
    aspect-ratio: 3 / 4;
  }
}

/* ... existing code ... */

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
.small{ font-size: 12px; font-weight: 300; letter-spacing: .06em; text-transform: uppercase; }

.levelValue{
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 36px;
  line-height: 1;
  color: rgba(255,255,255,.92);
  text-shadow: 0 2px 0 rgba(0,0,0,.45);
}
</style>