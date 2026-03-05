<template>
  <div class="container">
    <div v-if="loading" class="frame-subtitle">
      <span class="namePlaceholder">Carregando partida...</span>
    </div>

    <div v-else-if="error" class="frame-subtitle">
      <span class="namePlaceholder">{{ error }}</span>
    </div>

    <template v-else>
      <div class="topActions">
        <button class="pauseBtn" type="button" @click="pauseMatch" :disabled="pausing || turning">
          {{ pausing ? 'Pausando...' : 'Pause' }}
        </button>
      </div>

      <ZombieHud
          v-if="isZombieTurn"
          :players="players"
          :turn-phase="turnPhase"
          :turning="turning"
          @damage="damagePlayer"
          @revert="revertPlayer"
          @next="nextTurn"
      />

      <template v-else>
        <div class="frame-title frame-title--nav">
          <span class="frame-title__text">{{ currentPlayer.playerName }}</span>

          <button
              class="navBtn"
              type="button"
              @click="nextTurn"
              aria-label="Next turn"
          >
            &gt;
          </button>
        </div>

        <div class="frame-subtitle frame-subtitle--nav">
          <span class="frame-subtitle__text namePlaceholder">{{ currentPlayer.characterName }}</span>
          <span class="navSpacer" aria-hidden="true"></span>
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
                  <span><LifeHearts :current="life" :max="maxLife"/></span>
                </div>
              </StatBadge>

              <StatBadge title="Danger Level">
                <template #value>
                  <span class="levelValue">{{ level }}</span>
                </template>
                <HeartbeatMonitor :value="level"/>
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
              <EnemyItem name="Walkers" :many="0" image-src="/images/zombies/walker.webp"/>
              <EnemyItem name="Runners" :many="0" image-src="/images/zombies/runner.webp"/>
              <EnemyItem name="Fatties" :many="0" image-src="/images/zombies/fatty.webp"/>
              <EnemyItem name="Abomination" :many="0" image-src="/images/zombies/abomination.webp"/>
            </div>
          </FramePanel>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import FramePanel from '../components/FramePanel.vue'
import StatBadge from '../components/StatBadge.vue'
import EnemyItem from '../components/EnemyItem.vue'
import HeartbeatMonitor from '../components/HeartbeatMonitor.vue'
import LifeHearts from '../components/LifeHearts.vue'
import ZombieHud from '../components/zombieHud.vue'
import {API_BASE_URL} from '../../config/api.js'

const route = useRoute()
const router = useRouter()

const ACTIVE_MATCH_STORAGE_KEY = 'activeMatch'
const DAMAGE_EVENTS_STORAGE_KEY = 'damageEventsByPlayer'

const API_BASE = API_BASE_URL
const DAMAGE_API_BASE = API_BASE_URL

const loading = ref(false)
const turning = ref(false)
const pausing = ref(false)
const error = ref('')

const turnPhase = ref('PLAYER')
const isZombieTurn = computed(() => String(turnPhase.value || '').toUpperCase().startsWith('ZOMB'))

const players = ref([])

const currentPlayerIndex = ref(0)
const currentPlayer = computed(() => players.value[currentPlayerIndex.value] ?? players.value[0] ?? {
  playerName: '—',
  characterName: '—',
  characterImg: '/images/players/amy.webp'
})

function characterToImage(character) {
  const key = String(character || '').toUpperCase()
  if (key === 'AMY') return '/images/players/amy.webp'
  if (key === 'DOUG') return '/images/players/doug.webp'
  if (key === 'JOSH') return '/images/players/josh.webp'
  if (key === 'NED') return '/images/players/ned.webp'
  if (key === 'PHIL') return '/images/players/phil.webp'
  if (key === 'WANDA') return '/images/players/wanda.png'
  return '/images/players/amy.webp'
}

function applyMatchToHud(match) {
  turnPhase.value = match?.turnPhase ?? 'PLAYER'

  const backendPlayers = Array.isArray(match?.players) ? match.players : []

  players.value = backendPlayers.map(p => ({
    id: p.id,
    playerName: p.name ?? '—',
    characterName: p.character ?? '—',
    characterImg: characterToImage(p.character),
    life: p.life ?? 3,
    level: p.level ?? 0,
    zombiesKill: p.zombiesKill ?? 0
  }))

  if (players.value.length === 0) {
    throw new Error('Esta partida não possui jogadores cadastrados.')
  }

  const idxById = match?.currentPlayerId
      ? players.value.findIndex(p => p.id === match.currentPlayerId)
      : -1

  const idxByTurnIndex =
      Number.isInteger(match?.currentTurnIndex) &&
      match.currentTurnIndex >= 0 &&
      match.currentTurnIndex < players.value.length
          ? match.currentTurnIndex
          : -1

  currentPlayerIndex.value = idxById >= 0 ? idxById : (idxByTurnIndex >= 0 ? idxByTurnIndex : 0)
}

/**
 * Estado do jogo (por enquanto local).
 */
const maxLife = ref(3)
const life = computed(() => currentPlayer.value?.life ?? 3)
const level = computed(() => currentPlayer.value?.level ?? 0)

function getActiveMatch() {
  const raw = sessionStorage.getItem(ACTIVE_MATCH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getActiveMatchId() {
  return getActiveMatch()?.id ?? null
}

function loadDamageEventsMap() {
  const raw = sessionStorage.getItem(DAMAGE_EVENTS_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveDamageEventsMap(map) {
  sessionStorage.setItem(DAMAGE_EVENTS_STORAGE_KEY, JSON.stringify(map ?? {}))
}

function pushDamageEvent(playerId, eventId) {
  if (!playerId || !eventId) return
  const map = loadDamageEventsMap()
  const arr = Array.isArray(map[playerId]) ? map[playerId] : []
  arr.push(eventId)
  map[playerId] = arr
  saveDamageEventsMap(map)
}

function popLastDamageEvent(playerId) {
  const map = loadDamageEventsMap()
  const arr = Array.isArray(map[playerId]) ? map[playerId] : []
  const eventId = arr.pop()
  map[playerId] = arr
  saveDamageEventsMap(map)
  return eventId ?? null
}

async function pauseMatch() {
  const matchId = getActiveMatchId()
  if (!matchId) {
    error.value = 'Partida ativa não encontrada para pausar.'
    return
  }

  pausing.value = true
  error.value = ''
  try {
    const url = `${API_BASE}/matches/pause?match=${encodeURIComponent(matchId)}`
    const res = await fetch(url, {method: 'POST'})
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO PAUSAR PARTIDA (HTTP ${res.status}). ${text}`)
    }

    router.push({name: 'home'})
  } catch (e) {
    error.value = e?.message ?? 'Falha ao pausar partida'
  } finally {
    pausing.value = false
  }
}

async function damagePlayer(playerId) {
  if (!playerId) return
  error.value = ''
  try {
    const url = `${DAMAGE_API_BASE}/matches/damage?player=${encodeURIComponent(playerId)}&amount=1`
    const res = await fetch(url, {method: 'POST'})
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO APLICAR DANO (HTTP ${res.status}). ${text}`)
    }

    // O backend precisa retornar o damageEventId em algum formato.
    // Aceitamos: { damageEventId: "..." } ou { eventId: "..." } ou um match com "damageEventId".
    const data = await res.json().catch(() => null)
    const damageEventId = data?.damageEventId ?? data?.eventId ?? null

    if (damageEventId) {
      pushDamageEvent(playerId, damageEventId)
    }

    // Se o backend retornar a partida atualizada (players/turnPhase/etc), aplicamos.
    if (data?.players) {
      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(data))
      applyMatchToHud(data)
    } else {
      // fallback visual (se o backend não devolveu match): diminui 1 vida localmente
      const idx = players.value.findIndex(p => p.id === playerId)
      if (idx >= 0) {
        const p = players.value[idx]
        players.value[idx] = {...p, life: Math.max(0, Number(p.life ?? 0) - 1)}
      }
    }
  } catch (e) {
    error.value = e?.message ?? 'Falha ao aplicar dano'
  }
}

async function revertPlayer(playerId) {
  if (!playerId) return
  error.value = ''

  const eventId = popLastDamageEvent(playerId)
  if (!eventId) {
    error.value = 'Nenhum dano para reverter para este jogador.'
    return
  }

  try {
    const url = `${DAMAGE_API_BASE}/matches/damage/revert?event=${encodeURIComponent(eventId)}`
    const res = await fetch(url, {method: 'POST'})
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      // devolve o evento para não perder o histórico caso a chamada falhe
      pushDamageEvent(playerId, eventId)
      throw new Error(`ERRO AO REVERTER DANO (HTTP ${res.status}). ${text}`)
    }

    const data = await res.json().catch(() => null)

    if (data?.players) {
      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(data))
      applyMatchToHud(data)
    } else {
      // fallback visual: soma 1 vida localmente
      const idx = players.value.findIndex(p => p.id === playerId)
      if (idx >= 0) {
        const p = players.value[idx]
        players.value[idx] = {...p, life: Math.min(Number(maxLife.value ?? 3), Number(p.life ?? 0) + 1)}
      }
    }
  } catch (e) {
    error.value = e?.message ?? 'Falha ao reverter dano'
  }
}

async function loadMatchFromSession() {
  error.value = ''
  loading.value = true
  try {
    const raw = sessionStorage.getItem(ACTIVE_MATCH_STORAGE_KEY)
    if (!raw) {
      const matchFromQuery = route.query?.match
      throw new Error(matchFromQuery
          ? 'Partida não encontrada no storage (inicie a partida pela Home para carregar os jogadores).'
          : 'Nenhuma partida ativa. Volte e clique em "Iniciar partida".'
      )
    }

    const match = JSON.parse(raw)
    applyMatchToHud(match)

    maxLife.value = 3
  } catch (e) {
    players.value = []
    currentPlayerIndex.value = 0
    error.value = e?.message ?? 'Falha ao carregar a partida'
  } finally {
    loading.value = false
  }
}

async function nextTurn() {
  turning.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/matches/turn/next`, {method: 'POST'})
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO PASSAR TURNO (HTTP ${res.status}). ${text}`)
    }

    const match = await res.json()

    sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(match))
    applyMatchToHud(match)
  } catch (e) {
    error.value = e?.message ?? 'Falha ao passar turno'
  } finally {
    turning.value = false
  }
}

onMounted(loadMatchFromSession)
</script>

<style scoped>
.namePlaceholder {
  opacity: .95;
}

.topActions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.pauseBtn {
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, .65);
  background: rgba(0, 0, 0, .22);
  color: rgba(255, 255, 255, .92);
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 28px;
  letter-spacing: .03em;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .06) inset;
}

.pauseBtn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.frame-title--nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px;
  align-items: center;
  gap: 12px;
}

.frame-title__text {
  justify-self: center;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  font-size: clamp(28px, 6vw, 54px);
  line-height: 1;
}

@media (max-width: 420px) {
  .frame-title {
    padding: 14px 12px 12px;
  }

  .frame-title--nav {
    grid-template-columns: minmax(0, 1fr) 46px;
    gap: 10px;
  }

  .navBtn {
    width: 46px;
  }
}

.navBtn {
  height: 44px;
  width: 56px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, .65);
  background: rgba(0, 0, 0, .22);
  color: rgba(255, 255, 255, .92);
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .06) inset;
}

.navBtn:active {
  transform: translateY(1px);
}

.navBtn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

/* Character: tamanho estável + fundo dangerZone dentro do quadrante */
.placeholder--character {
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

.placeholder--character::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;

  background-image: linear-gradient(180deg, rgba(0, 0, 0, .35), rgba(0, 0, 0, .65)),
  url("/images/others/dangerZone.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  border-radius: inherit;
  opacity: 0.25;
}

.character__img {
  position: relative;
  z-index: 1;

  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;

  object-fit: contain;
  object-position: center bottom;
  display: block;

  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, .55));
}

@media (max-width: 1100px) {
  .placeholder--character {
    min-height: 420px;
    aspect-ratio: 3 / 4;
  }
}

/* center */
.center {
  display: grid;
  gap: 12px;
  grid-template-rows: auto 1fr;
}

.center__top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 1100px) {
  .center__top {
    grid-template-columns: 1fr;
  }
}

.center__bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 700px) {
  .center__bottom {
    grid-template-columns: 1fr;
  }
}

.card {
  min-height: 360px;
}

/* enemies */
.enemiesTitle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.enemiesTitle h2 {
  font-size: 54px;
}

.enemiesList {
  display: grid;
  gap: 12px;
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 12px;
  font-weight: 300;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.levelValue {
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 36px;
  line-height: 1;
  color: rgba(255, 255, 255, .92);
  text-shadow: 0 2px 0 rgba(0, 0, 0, .45);
}

.frame-subtitle--nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px; /* mesma largura do botão */
  align-items: center;
  gap: 12px;
}

.frame-subtitle__text {
  justify-self: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 420px) {
  .frame-subtitle--nav {
    grid-template-columns: minmax(0, 1fr) 46px; /* mesma do mobile */
    gap: 10px;
  }
}
</style>