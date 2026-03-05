<template>
  <div class="zombieHud">
    <div class="frame-title frame-title--nav">
      <span class="frame-title__text">Zombies</span>

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

    <div class="frame-subtitle frame-subtitle--nav">
      <span class="namePlaceholder">AMOUNT: {{ totalZombies }}</span>
    </div>

    <div class="hud-grid">
      <FramePanel>
        <div class="zBody">
          <div class="zHero">
            <img class="zHero__img" src="/images/zombies/abomination.webp" alt="Abomination"/>
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
              <div class="pName" v-if="(p.life ?? 0) > 0">{{ p.playerName }}</div>
              <div class="pName" v-else>Dead Player</div>
              <div class="pMeta muted">{{ p.characterName }}</div>
            </div>

            <div class="pMid">
              <LifeHearts v-if="(p.life ?? 0) > 0" :current="p.life ?? 0" :max="3" />
              <span v-else class="deadSkull" aria-label="Dead player" role="img">☠️☠️☠️</span>
            </div>

            <div class="pRight">
              <button class="btnDamage" type="button" @click="$emit('damage', p.id)" :disabled="turning">
                Damage
              </button>

              <button class="enemy__btn" type="button" @click="$emit('revert', p.id)" :disabled="turning">
                Revert
              </button>
            </div>
          </div>
          <div v-if="players.length === 0" class="empty">
            Nenhum jogador na partida.
          </div>
        </div>
      </FramePanel>
      <FramePanel>
        <template #title>
          <div class="zTitle">
            <h2>In Game</h2>
          </div>
        </template>

        <div class="enemiesList">
          <Zombies name="Walkers" :many="0" image-src="/images/zombies/walker.webp" />
          <Zombies name="Runners" :many="0" image-src="/images/zombies/runner.webp" />
          <Zombies name="Fatties" :many="0" image-src="/images/zombies/fatty.webp" />
          <Zombies name="Abomination" :many="0" image-src="/images/zombies/abomination.webp" />
        </div>
      </FramePanel>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import FramePanel from '../components/FramePanel.vue'
import LifeHearts from '../components/LifeHearts.vue'
import Zombies from "./Zombies.vue";

defineEmits(['damage', 'revert', 'next'])

const props = defineProps({
  players: {type: Array, default: () => []},
  turnPhase: {type: String, default: ''},
  turning: {type: Boolean, default: false},
  zombies: {type: Object, default: null}
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