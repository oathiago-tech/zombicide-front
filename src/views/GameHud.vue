<template>
  <div class="container">
    <div v-if="loading" class="frame-subtitle">
      <span class="namePlaceholder">Carregando partida...</span>
    </div>

    <div v-else-if="fatalError" class="frame-subtitle">
      <span class="namePlaceholder">{{ fatalError }}</span>
    </div>

    <template v-else>
      <!-- Alerta de EVENTO (novo) -->
      <div v-if="eventAlert" class="uiError uiError--event" role="alert" aria-live="assertive">
        <span class="uiError__text">{{ eventAlert }}</span>
        <button
          class="uiError__close"
          type="button"
          @click="eventAlert = ''"
          aria-label="Fechar alerta"
        >
          ×
        </button>
      </div>

      <!-- Mensagem não-bloqueante: aparece e mantém o HUD na tela -->
      <div v-if="uiError" class="uiError" role="alert" aria-live="polite">
        <span class="uiError__text">{{ uiError }}</span>
        <button
          class="uiError__close"
          type="button"
          @click="uiError = ''"
          aria-label="Fechar mensagem"
        >
          ×
        </button>
      </div>

      <div class="topActions">
        <button class="enemy__btn" type="button" @click="pauseMatch" :disabled="pausing || turning">
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
            :disabled="turning"
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
                  <span><LifeHearts :current="life" :max="maxLife" /></span>
                </div>
              </StatBadge>

              <StatBadge title="Danger Level">
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
              <EnemyItem name="Walkers" :many="zombies.walkers" image-src="/images/zombies/walker.webp" />
              <EnemyItem name="Runners" :many="zombies.runners" image-src="/images/zombies/runner.webp" />
              <EnemyItem name="Fatties" :many="zombies.fatties" image-src="/images/zombies/fatty.webp" />
              <EnemyItem name="Abomination" :many="zombies.abomination" image-src="/images/zombies/abomination.webp" />
            </div>
          </FramePanel>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FramePanel from '../components/FramePanel.vue'
import StatBadge from '../components/StatBadge.vue'
import EnemyItem from '../components/EnemyItem.vue'
import HeartbeatMonitor from '../components/HeartbeatMonitor.vue'
import LifeHearts from '../components/LifeHearts.vue'
import ZombieHud from '../components/zombieHud.vue'
import { API_BASE_URL } from '../../config/api.js'

const route = useRoute()
const router = useRouter()

const ACTIVE_MATCH_STORAGE_KEY = 'activeMatch'
const DAMAGE_EVENTS_STORAGE_KEY = 'damageEventsByPlayer'

// Eventos (polling)
const LAST_EVENT_DATETIME_STORAGE_KEY = 'lastEventDateTime'
const eventAlert = ref('')
let eventAlertTimer = null
let eventsPollingTimer = null
const lastEventDateTime = ref('')

const API_BASE = API_BASE_URL
const DAMAGE_API_BASE = API_BASE_URL

const loading = ref(false)
const turning = ref(false)
const pausing = ref(false)

const fatalError = ref('')
const uiError = ref('')
let uiErrorTimer = null

function showUiError(message) {
  uiError.value = String(message || 'Falha na comunicação com o servidor.')
  if (uiErrorTimer) window.clearTimeout(uiErrorTimer)
  uiErrorTimer = window.setTimeout(() => {
    uiError.value = ''
    uiErrorTimer = null
  }, 6000)
}

function showEndpointError(e, fallback) {
  showUiError(e?.message ?? fallback ?? 'Falha ao chamar o endpoint.')
}

function showEventAlert(message) {
  eventAlert.value = String(message || 'Novo evento recebido.')
  if (eventAlertTimer) window.clearTimeout(eventAlertTimer)
  eventAlertTimer = window.setTimeout(() => {
    eventAlert.value = ''
    eventAlertTimer = null
  }, 5000)
}

function loadLastEventDateTime() {
  const raw = sessionStorage.getItem(LAST_EVENT_DATETIME_STORAGE_KEY)
  lastEventDateTime.value = raw ? String(raw) : ''
}

function saveLastEventDateTime(isoString) {
  lastEventDateTime.value = String(isoString || '')
  sessionStorage.setItem(LAST_EVENT_DATETIME_STORAGE_KEY, lastEventDateTime.value)
}

function isNewerEventDateTime(incomingIso) {
  const incoming = String(incomingIso || '')
  if (!incoming) return false

  // Se ainda não tem último, salva e não alerta (evita alertar na primeira carga)
  if (!lastEventDateTime.value) return true

  const a = Date.parse(incoming)
  const b = Date.parse(lastEventDateTime.value)

  // Se parse falhar, faz fallback para comparação por string (ISO ordena bem)
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return incoming > lastEventDateTime.value
  }

  return a > b
}

function formatEventMessage(ev) {
  const type = ev?.type ? String(ev.type) : 'EVENT'
  const danger = ev?.dangerLevel ? String(ev.dangerLevel) : ''
  const amount = Number(ev?.amount ?? 0)
  const spawn = ev?.spawnPointType ? String(ev.spawnPointType) : ''
  const parts = [
    `Novo evento: ${type}`,
    danger ? `Danger: ${danger}` : '',
    Number.isFinite(amount) && amount ? `Amount: ${amount}` : '',
    spawn ? `Spawn: ${spawn}` : ''
  ].filter(Boolean)
  return parts.join(' • ')
}

async function fetchLastEventOnce() {
  const url = `${API_BASE}/events/last`
  const res = await fetch(url, { method: 'GET' })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`ERRO AO BUSCAR EVENTO (HTTP ${res.status}). ${text}`)
  }

  return await res.json().catch(() => null)
}

async function pollLastEvent() {
  try {
    const ev = await fetchLastEventOnce()
    const incomingDateTime = ev?.dateTime

    if (!incomingDateTime) return

    const shouldAlert = isNewerEventDateTime(incomingDateTime)

    if (shouldAlert) {
      // Se não havia último, a primeira execução vai cair aqui.
      // Para não "alertar ao entrar", só alerta se já existia um last salvo.
      const hadPrevious = Boolean(lastEventDateTime.value)

      saveLastEventDateTime(incomingDateTime)

      if (hadPrevious) {
        showEventAlert(formatEventMessage(ev))
      }
    }
  } catch (e) {
    // polling é contínuo; evita "fatalError" por isso
    showEndpointError(e, 'Falha ao buscar evento')
  }
}

function startEventsPolling() {
  if (eventsPollingTimer) return
  // Carrega o último salvo (se existir) e faz uma chamada imediata
  loadLastEventDateTime()
  pollLastEvent()
  eventsPollingTimer = window.setInterval(pollLastEvent, 1000)
}

function stopEventsPolling() {
  if (eventsPollingTimer) {
    window.clearInterval(eventsPollingTimer)
    eventsPollingTimer = null
  }
  if (eventAlertTimer) {
    window.clearTimeout(eventAlertTimer)
    eventAlertTimer = null
  }
}

const turnPhase = ref('PLAYER')
const isZombieTurn = computed(() => String(turnPhase.value || '').toUpperCase().startsWith('ZOMB'))

const players = ref([])

/**
 * Contagem de zumbis (vindo do DTO Match):
 * - activeWalkers
 * - activeRunners
 * - activeFaties
 * - activeAbomination
 *
 * Caso venha null/undefined, mantém 0 por padrão.
 */
const zombies = ref({
  walkers: 0,
  runners: 0,
  fatties: 0,
  abomination: 0
})

function toNonNegativeIntOrZero(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.trunc(n))
}

const currentPlayerIndex = ref(0)
const currentPlayer = computed(
  () =>
    players.value[currentPlayerIndex.value] ??
    players.value[0] ?? {
      playerName: '—',
      characterName: '—',
      characterImg: '/images/players/amy.webp'
    }
)

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

  zombies.value = {
    walkers: toNonNegativeIntOrZero(match?.activeWalkers),
    runners: toNonNegativeIntOrZero(match?.activeRunners),
    // backend usa "activeFaties" (com um 't') e o HUD exibe "Fatties"
    fatties: toNonNegativeIntOrZero(match?.activeFaties),
    abomination: toNonNegativeIntOrZero(match?.activeAbomination)
  }

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

  const idxById = match?.currentPlayerId ? players.value.findIndex(p => p.id === match.currentPlayerId) : -1

  const idxByTurnIndex =
    Number.isInteger(match?.currentTurnIndex) &&
    match.currentTurnIndex >= 0 &&
    match.currentTurnIndex < players.value.length
      ? match.currentTurnIndex
      : -1

  currentPlayerIndex.value = idxById >= 0 ? idxById : idxByTurnIndex >= 0 ? idxByTurnIndex : 0
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
    showUiError('Partida ativa não encontrada para pausar.')
    return
  }

  pausing.value = true
  uiError.value = ''
  try {
    const url = `${API_BASE}/matches/pause?match=${encodeURIComponent(matchId)}`
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO PAUSAR PARTIDA (HTTP ${res.status}). ${text}`)
    }

    router.push({ name: 'home' })
  } catch (e) {
    showEndpointError(e, 'Falha ao pausar partida')
  } finally {
    pausing.value = false
  }
}

async function damagePlayer(playerId) {
  if (!playerId) return
  uiError.value = ''
  try {
    const url = `${DAMAGE_API_BASE}/matches/damage?player=${encodeURIComponent(playerId)}&amount=1`
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO APLICAR DANO (HTTP ${res.status}). ${text}`)
    }

    const data = await res.json().catch(() => null)
    const damageEventId = data?.damageEventId ?? data?.eventId ?? null

    if (damageEventId) {
      pushDamageEvent(playerId, damageEventId)
    }

    if (data?.players) {
      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(data))
      applyMatchToHud(data)
    } else {
      const idx = players.value.findIndex(p => p.id === playerId)
      if (idx >= 0) {
        const p = players.value[idx]
        players.value[idx] = { ...p, life: Math.max(0, Number(p.life ?? 0) - 1) }
      }
    }
  } catch (e) {
    showEndpointError(e, 'Falha ao aplicar dano')
  }
}

async function revertPlayer(playerId) {
  if (!playerId) return
  uiError.value = ''

  const eventId = popLastDamageEvent(playerId)
  if (!eventId) {
    showUiError('Nenhum dano para reverter para este jogador.')
    return
  }

  try {
    const url = `${DAMAGE_API_BASE}/matches/damage/revert?event=${encodeURIComponent(eventId)}`
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      pushDamageEvent(playerId, eventId)
      throw new Error(`ERRO AO REVERTER DANO (HTTP ${res.status}). ${text}`)
    }

    const data = await res.json().catch(() => null)

    if (data?.players) {
      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(data))
      applyMatchToHud(data)
    } else {
      const idx = players.value.findIndex(p => p.id === playerId)
      if (idx >= 0) {
        const p = players.value[idx]
        players.value[idx] = { ...p, life: Math.min(Number(maxLife.value ?? 3), Number(p.life ?? 0) + 1) }
      }
    }
  } catch (e) {
    showEndpointError(e, 'Falha ao reverter dano')
  }
}

async function loadMatchFromSession() {
  fatalError.value = ''
  uiError.value = ''
  loading.value = true
  try {
    const raw = sessionStorage.getItem(ACTIVE_MATCH_STORAGE_KEY)
    if (!raw) {
      const matchFromQuery = route.query?.match
      throw new Error(
        matchFromQuery
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
    fatalError.value = e?.message ?? 'Falha ao carregar a partida'
  } finally {
    loading.value = false
  }
}

async function nextTurn() {
  turning.value = true
  uiError.value = ''
  try {
    const res = await fetch(`${API_BASE}/matches/turn/next`, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO PASSAR TURNO (HTTP ${res.status}). ${text}`)
    }

    const match = await res.json()

    sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(match))
    applyMatchToHud(match)
  } catch (e) {
    showEndpointError(e, 'Falha ao passar turno')
  } finally {
    turning.value = false
  }
}

onMounted(() => {
  loadMatchFromSession()
  startEventsPolling()
})

onUnmounted(() => {
  stopEventsPolling()
})
</script>