<template>
  <div class="container home">
    <FramePanel>
      <div class="banner">
        <img class="banner__img" src="/images/others/banner.png" alt="Banner"/>
      </div>
    </FramePanel>

    <div class="home__grid">
      <FramePanel>
        <template #title>
          <div class="homeTitle">
            <h2>Matches</h2>
          </div>
        </template>

        <div class="gameList">
          <div v-if="loading" class="empty">
            Loading Matches...
          </div>

          <div v-else-if="error" class="empty">
            {{ error }}
          </div>

          <div v-else>
            <div v-for="g in games" :key="g.id" class="gameRow">
              <div class="gameRow__left">
                <div class="gameRow__name">
                  {{ g.campaignName || 'Sem campanha' }}
                </div>

                <div class="gameRow__meta">
                  <span class="pill" :class="difficultClass(g.difficulty)">
                    {{ g.difficulty || '—' }}
                  </span>

                  <span class="muted">Players: {{ g.players?.length ?? 0 }}</span>
                  <!--                  <span class="muted">-->
                  <!--                    {{ (g.players ?? []).map(p => p.name).filter(Boolean).join(', ') || '—' }}-->
                  <!--                  </span>-->
                </div>
              </div>

              <div class="gameRow__actions">
                <button class="btn btn--primary" type="button" @click="startGame(g)" :disabled="startingId === g.id">
                  {{ startingId === g.id ? 'Iniciando...' : 'Start Match' }}
                </button>

                <button class="btn btn--danger" type="button" @click="deleteGame(g)">
                  Delete
                </button>
              </div>
            </div>

            <div v-if="games.length === 0" class="empty">
              Nenhuma partida criada ainda.
            </div>
          </div>
        </div>
      </FramePanel>

      <FramePanel>
        <template #title>
          <div class="homeTitle">
            <h2>Actions</h2>
          </div>
        </template>

        <div class="sideActions">
          <button class="btn btn--primary btn--big" type="button" @click="goCreateMatch">
            Create Match
          </button>

          <button class="btn btn--ghost" type="button" @click="loadGames" :disabled="loading">
            Update Matches
          </button>

        </div>
      </FramePanel>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import FramePanel from '../components/FramePanel.vue'
import {API_BASE_URL} from '../../config/api.js'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const games = ref([])
const startingId = ref(null)

const API_BASE = API_BASE_URL
const ACTIVE_MATCH_STORAGE_KEY = 'activeMatch'

function difficultClass(difficult) {
  const d = String(difficult ?? '').toUpperCase()
  if (d === 'EASY') return 'pill--green'
  if (d === 'NORMAL') return 'pill--yellow'
  if (d === 'HARD') return 'pill--red'
  return 'pill--muted'
}

async function loadGames() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('http://192.168.100.4:8080/matches/all', {method: 'GET'})
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO LISTAR PARTIDAS (HTTP ${res.status}). ${text}`)
    }
    const data = await res.json()
    games.value = Array.isArray(data) ? data : []
    if (!Array.isArray(data)) {
      error.value = 'Resposta inesperada do backend (era esperado uma lista de partidas).'
    }
  } catch (e) {
    error.value = e?.message ?? 'Falha ao listar partidas'
    games.value = []
  } finally {
    loading.value = false
  }
}

async function startGame(game) {
  if (!game?.id) {
    error.value = 'Partida inválida (sem id).'
    return
  }

  startingId.value = game.id
  error.value = ''
  try {
    const url = `${API_BASE}/matches/start?match=${encodeURIComponent(game.id)}`
    const res = await fetch(url, {method: 'POST'})

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ERRO AO INICIAR PARTIDA (HTTP ${res.status}). ${text}`)
    }

    const match = await res.json()

    // salva a partida ativa para o HUD carregar somente os players dessa partida
    sessionStorage.setItem(ACTIVE_MATCH_STORAGE_KEY, JSON.stringify(match))

    // opcional: também passa o match na query (útil para debug)
    router.push({name: 'game', query: {match: match?.id ?? game.id}})
  } catch (e) {
    error.value = e?.message ?? 'Falha ao iniciar partida'
  } finally {
    startingId.value = null
  }
}

function continueGame(game) {
  router.push({name: 'game', query: {match: game?.id}})
}

function editPlayers(game) {
  alert(`Editar jogadores: ${game?.campaign?.name ?? game?.id ?? ''}`)
}

function deleteGame(game) {
  alert('Excluir ainda não implementado no backend.')
}

function goCreateMatch() {
  router.push({name: 'match-create'})
}

onMounted(loadGames)
</script>