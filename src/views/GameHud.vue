<template>
  <div class="container">
    <div v-if="loading" class="frame-subtitle">
      <span class="namePlaceholder">Carregando partida...</span>
    </div>

    <div v-else-if="fatalError" class="frame-subtitle">
      <span class="namePlaceholder">{{ fatalError }}</span>
    </div>

    <template v-else>
      <!-- Alerta de EVENTO -->
      <div v-if="eventAlert" class="uiError uiError--event" role="alert" aria-live="assertive">
        <span class="uiError__text">{{ eventAlert }}</span>
        <button class="uiError__close" type="button" @click="eventAlert = ''" aria-label="Fechar alerta">
          ×
        </button>
      </div>

      <!-- Mensagem não-bloqueante -->
      <div v-if="uiError" class="uiError" role="alert" aria-live="polite">
        <span class="uiError__text">{{ uiError }}</span>
        <button class="uiError__close" type="button" @click="uiError = ''" aria-label="Fechar mensagem">
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
          :zombies="zombies"
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
              <EnemyItem
                  name="Abomination"
                  :many="zombies.abomination"
                  image-src="/images/zombies/abomination.webp"
              />
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

// TRAVA do player exibido no HUD (só muda quando o turno muda)
const HUD_PLAYER_ID_STORAGE_KEY = 'hudPlayerId'
const HUD_TURN_KEY_STORAGE_KEY = 'hudTurnKey'
const hudPlayerId = ref('')
const hudTurnKey = ref('')

function loadHudLockFromSession() {
  hudPlayerId.value = String(sessionStorage.getItem(HUD_PLAYER_ID_STORAGE_KEY) || '')
  hudTurnKey.value = String(sessionStorage.getItem(HUD_TURN_KEY_STORAGE_KEY) || '')
}

function saveHudLockToSession() {
  sessionStorage.setItem(HUD_PLAYER_ID_STORAGE_KEY, String(hudPlayerId.value || ''))
  sessionStorage.setItem(HUD_TURN_KEY_STORAGE_KEY, String(hudTurnKey.value || ''))
}

const API_BASE = API_BASE_URL
const DAMAGE_API_BASE = API_BASE_URL

const loading = ref(false)
const turning = ref(false)
const pausing = ref(false)

const fatalError = ref('')
const uiError = ref('')
let uiErrorTimer = null

let refreshingMatch = false

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

  if (!lastEventDateTime.value) return true

  const a = Date.parse(incoming)
  const b = Date.parse(lastEventDateTime.value)

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

// ====== SFX por evento ======
const audioUnlocked = ref(false)
const pendingSfxQueue = []

function unlockAudioOnce() {
  if (audioUnlocked.value) return
  audioUnlocked.value = true

  // Tenta "desbloquear" áudio (alguns browsers exigem tentativa dentro de gesto do usuário)
  try {
    const a = new Audio('/sounds/shot.mp3')
    a.muted = true
    const p = a.play()
    if (p && typeof p.then === 'function') {
      p.then(() => {
        a.pause()
        a.currentTime = 0
        a.muted = false
      }).catch(() => {
        a.muted = false
      })
    } else {
      a.pause()
      a.currentTime = 0
      a.muted = false
    }
  } catch {
    // ignore
  }

  // Drena fila de sons pendentes
  while (pendingSfxQueue.length) {
    const url = pendingSfxQueue.shift()
    if (url) void playSfx(url)
  }
}

async function playSfx(url) {
  if (!audioUnlocked.value) {
    pendingSfxQueue.push(url)
    return
  }

  try {
    // Cria um Audio novo por disparo (mais confiável para tocar "sempre")
    const a = new Audio(url)
    a.preload = 'auto'
    a.currentTime = 0
    await a.play()
  } catch {
    // ignore (autoplay / erro de carregamento)
  }
}

function playEventSfx(ev) {
  const type = String(ev?.type ?? '').toUpperCase()

  if (type === 'ZOMBIE_KILL') {
    void playSfx('/sounds/shot.mp3')
    return
  }

  if (type === 'ZOMBIE_CARD_SCANNED') {
    void playSfx('/sounds/zombies-sound.mp3')
    return
  }
}

async function pollLastEvent() {
  try {
    const ev = await fetchLastEventOnce()
    const incomingDateTime = ev?.dateTime
    if (!incomingDateTime) return

    const shouldRefresh = isNewerEventDateTime(incomingDateTime)
    if (!shouldRefresh) return

    const hadPrevious = Boolean(lastEventDateTime.value)
    saveLastEventDateTime(incomingDateTime)

    // Toca som baseado no tipo do evento (somente para eventos "novos" após o baseline)
    if (hadPrevious) {
      playEventSfx(ev)
    }

    await refreshMatch()
  } catch (e) {
    showEndpointError(e, 'Falha ao buscar evento')
  }
}

function startEventsPolling() {
  if (eventsPollingTimer) return
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

// Detectar perda de vida (ferimentos) para tocar attack.mp3
const lastLifeByPlayerId = ref({})

function buildLifeMap(list) {
  const map = {}
  const arr = Array.isArray(list) ? list : []
  for (const p of arr) {
    const id = String(p?.id ?? '')
    if (!id) continue
    map[id] = Number(p?.life ?? 0) || 0
  }
  return map
}

function didAnyLifeDecrease(prevMap, nextPlayers) {
  const arr = Array.isArray(nextPlayers) ? nextPlayers : []
  for (const p of arr) {
    const id = String(p?.id ?? '')
    if (!id) continue
    const nextLife = Number(p?.life ?? 0) || 0
    const prevLife = Number(prevMap?.[id] ?? nextLife) || 0
    if (nextLife < prevLife) return true
  }
  return false
}

const playerNameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

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

// Som quando zumbis entram em campo
const zombieSfx = new Audio('/sounds/zombies-sound.mp3')
zombieSfx.preload = 'auto'

// Som quando um zumbi morre
const shotSfx = new Audio('/sounds/shot.mp3')
shotSfx.preload = 'auto'

const lastTotalZombies = ref(0)

function getTotalZombies(z) {
  const walkers = Number(z?.walkers ?? 0) || 0
  const runners = Number(z?.runners ?? 0) || 0
  const fatties = Number(z?.fatties ?? 0) || 0
  const abomination = Number(z?.abomination ?? 0) || 0
  return walkers + runners + fatties + abomination
}

async function playZombieSpawnSfx() {
  try {
    zombieSfx.currentTime = 0
    await zombieSfx.play()
  } catch {
    // Autoplay pode ser bloqueado pelo navegador
  }
}

async function playShotSfx() {
  try {
    shotSfx.currentTime = 0
    await shotSfx.play()
  } catch {
    // Autoplay pode ser bloqueado pelo navegador
  }
}

function applyMatchToHud(match) {
  turnPhase.value = match?.turnPhase ?? 'PLAYER'

  zombies.value = {
    walkers: toNonNegativeIntOrZero(match?.activeWalkers),
    runners: toNonNegativeIntOrZero(match?.activeRunners),
    fatties: toNonNegativeIntOrZero(match?.activeFaties),
    abomination: toNonNegativeIntOrZero(match?.activeAbomination)
  }

  const newTotal = getTotalZombies(zombies.value)

  // aumentou => entrou zumbi
  if (newTotal > lastTotalZombies.value) {
    playZombieSpawnSfx()
  }

  // diminuiu => matou zumbi
  if (newTotal < lastTotalZombies.value) {
    playShotSfx()
  }

  lastTotalZombies.value = newTotal

  const backendPlayers = Array.isArray(match?.players) ? match.players : []

  const mappedPlayers = backendPlayers.map(p => ({
    id: p.id,
    playerName: p.name ?? '—',
    characterName: p.character ?? '—',
    characterCode: p.character ?? '',
    characterImg: characterToImage(p.character),
    life: p.life ?? 3,
    level: p.level ?? 0,
    zombiesKill: p.zombiesKill ?? 0
  }))

  // Se algum player perdeu vida desde a última atualização, toca "attack"
  if (didAnyLifeDecrease(lastLifeByPlayerId.value, mappedPlayers)) {
    void playSfx('/sounds/attack.mp3')
  }
  lastLifeByPlayerId.value = buildLifeMap(mappedPlayers)

  mappedPlayers.sort((a, b) => {
    const byName = playerNameCollator.compare(String(a.playerName ?? ''), String(b.playerName ?? ''))
    if (byName !== 0) return byName
    return playerNameCollator.compare(String(a.id ?? ''), String(b.id ?? ''))
  })

  players.value = mappedPlayers

  if (players.value.length === 0) {
    throw new Error('Esta partida não possui jogadores cadastrados.')
  }

  // Assinatura do turno (mude aqui se o backend tiver outro campo melhor)
  const incomingTurnKey = [
    String(match?.turnPhase ?? ''),
    String(match?.currentTurnIndex ?? ''),
    String(match?.currentPlayerId ?? '')
  ].join('|')

  const incomingPlayerId = String(match?.currentPlayerId || '')

  // Inicializa a trava se ainda não existir
  if (!hudTurnKey.value && incomingTurnKey) {
    hudTurnKey.value = incomingTurnKey
  }
  if (!hudPlayerId.value && incomingPlayerId) {
    hudPlayerId.value = incomingPlayerId
  }

  // Só troca o player do HUD quando o TURNO mudar
  if (incomingTurnKey && incomingTurnKey !== hudTurnKey.value) {
    hudTurnKey.value = incomingTurnKey
    hudPlayerId.value = incomingPlayerId
  }

  saveHudLockToSession()

  const idxByHudId = hudPlayerId.value
    ? players.value.findIndex(p => p.id === hudPlayerId.value)
    : -1

  currentPlayerIndex.value = idxByHudId >= 0 ? idxByHudId : 0
}

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

    if (damageEventId) pushDamageEvent(playerId, damageEventId)

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

async function revertPlayer(payload) {
  uiError.value = ''

  const matchId = getActiveMatchId()
  if (!matchId) {
    showUiError('Partida ativa não encontrada para reverter dano.')
    return
  }

  const playerId = typeof payload === 'string' ? payload : payload?.playerId
  const characterCode =
      typeof payload === 'object' && payload
          ? payload.characterCode
          : null

  if (!playerId || !characterCode) {
    showUiError('Dados insuficientes para reverter (playerId/characterCode).')
    return
  }

  try {
    const url = `${DAMAGE_API_BASE}/matches/damage/revert?match=${encodeURIComponent(matchId)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: String(playerId),
        characterCode: String(characterCode)
      })
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO REVERTER DANO (HTTP ${res.status}). ${text}`)
    }

    const data = await res.json().catch(() => null)
    if (data) {
      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(data))
      applyMatchToHud(data)
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

async function refreshMatch() {
  const matchId = getActiveMatchId()
  if (!matchId || refreshingMatch) return

  refreshingMatch = true
  try {
    const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}`, { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO ATUALIZAR HUD (HTTP ${res.status}). ${text}`)
    }

    const match = await res.json().catch(() => null)
    if (match) {
      sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(match))
      applyMatchToHud(match)
    }
  } catch (e) {
    showEndpointError(e, 'Falha ao atualizar HUD após evento')
  } finally {
    refreshingMatch = false
  }
}

onMounted(() => {
  // Desbloqueia áudio no primeiro clique/toque do usuário
  window.addEventListener('pointerdown', unlockAudioOnce, { once: true })

  // baseline pra não tocar som no primeiro load
  lastTotalZombies.value = getTotalZombies(zombies.value)
  lastLifeByPlayerId.value = buildLifeMap(players.value)

  loadMatchFromSession()
  startEventsPolling()
})

onUnmounted(() => {
  stopEventsPolling()
})
</script>