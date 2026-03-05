<template>
  <div class="container create">
    <FramePanel>
      <div class="banner">
        <img class="banner__img" src="/images/others/banner.png" alt="Banner"/>
      </div>
    </FramePanel>

    <div class="create__grid">
      <FramePanel>
        <template #title>
          <div class="titleCenter">
            <h2>Create Match</h2>
          </div>
        </template>

        <form class="form" @submit.prevent="submit">
          <div class="field">
            <label class="label">Nome da campanha</label>
            <input
                v-model.trim="campaign"
                class="input"
                type="text"
                placeholder="Ex.: Test One"
                required
            />
          </div>

          <div class="field">
            <label class="label">Difficulty</label>
            <select v-model="difficult" class="select">
              <option value="EASY">EASY</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HARD">HARD</option>
            </select>
          </div>

          <div class="playersHeader">
            <h3 class="playersHeader__title">Players</h3>
            <div class="playersHeader__right">
              <button
                  class="btn btn--primary"
                  type="button"
                  @click="addPlayer"
                  :disabled="players.length >= 6 || availableCharacters.length === 0"
              >
                Add Player
              </button>
            </div>
          </div>

          <div class="playersList">
            <div v-for="(p, idx) in players" :key="p.id" class="playerRow">
              <div class="playerRow__portrait">
                <img
                    v-if="p.character"
                    class="portrait__img"
                    :src="characterByTag[p.character]?.img"
                    :alt="p.character"
                />
                <div v-else class="portrait__empty">—</div>
              </div>

              <div class="playerRow__fields">
                <div class="field">
                  <label class="label">Real Name</label>
                  <input
                      v-model.trim="p.name"
                      class="input"
                      type="text"
                      placeholder="Ex.: Thiago"
                      required
                  />
                </div>

                <div class="field">
                  <label class="label">Character</label>
                  <select v-model="p.character" class="select" required>
                    <option disabled value="">Selecione</option>

                    <!-- mantém a opção atual mesmo se já selecionada -->
                    <option
                        v-for="c in characterOptionsFor(p)"
                        :key="c.tag"
                        :value="c.tag"
                    >
                      {{ c.tag }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="playerRow__actions">
                <button class="btn btn--danger" type="button" @click="removePlayer(idx)">
                  Remover
                </button>
              </div>
            </div>

            <div v-if="players.length === 0" class="empty">
              Add up to 6 players. Each character can only be chosen once.
            </div>
          </div>

          <div class="formActions">
            <button class="btn btn--ghost" type="button" @click="goBack">
              Voltar
            </button>

            <button class="btn btn--primary btn--big" type="submit" :disabled="submitting || !canSubmit">
              {{ submitting ? 'Enviando...' : 'Criar partida' }}
            </button>
          </div>

          <div v-if="error" class="errorBox">
            {{ error }}
          </div>
        </form>
      </FramePanel>

      <FramePanel>
        <template #title>
          <div class="titleCenter">
            <h2>Info</h2>
          </div>
        </template>

        <div class="info">
          <div class="muted">
            Characters available
            <div class="tags">
              <span v-for="c in characters" :key="c.tag" class="tagPill">{{ c.tag }}</span>
            </div>
          </div>
        </div>
      </FramePanel>
    </div>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import FramePanel from '../components/FramePanel.vue'
import {API_BASE_URL} from '../../config/api.js'

const router = useRouter()

const characters = [
  {tag: 'AMY', img: '/images/players/amy.webp'},
  {tag: 'DOUG', img: '/images/players/doug.webp'},
  {tag: 'JOSH', img: '/images/players/josh.webp'},
  {tag: 'NED', img: '/images/players/ned.webp'},
  {tag: 'PHIL', img: '/images/players/phil.webp'},
  {tag: 'WANDA', img: '/images/players/wanda.png'}
]

const characterByTag = Object.fromEntries(characters.map(c => [c.tag, c]))

const campaign = ref('')
const difficult = ref('EASY')
const players = reactive([])

const submitting = ref(false)
const error = ref('')
const lastPayload = ref('')

const selectedTags = computed(() => players.map(p => p.character).filter(Boolean))
const availableCharacters = computed(() => characters.filter(c => !selectedTags.value.includes(c.tag)))

const canSubmit = computed(() => {
  if (!campaign.value) return false
  if (!players.length) return false
  return players.every(p => p.name && p.character)
})

function newId() {
  return Math.random().toString(16).slice(2)
}

function addPlayer() {
  if (players.length >= 6) return
  players.push({id: newId(), name: '', character: ''})
}

function removePlayer(index) {
  players.splice(index, 1)
}

function characterOptionsFor(player) {
  const current = player.character
  const list = [...availableCharacters.value]
  if (current && !list.some(c => c.tag === current)) {
    list.unshift(characterByTag[current])
  }
  return list
}

function goBack() {
  router.push({name: 'home'})
}

async function submit() {
  error.value = ''
  lastPayload.value = ''

  const payload = {
    campaign: {name: campaign.value},
    players: players.map(p => ({
      name: p.name,
      character: p.character
    })),
    difficult: difficult.value
  }

  lastPayload.value = JSON.stringify(payload, null, 2)

  submitting.value = true
  try {
    const res = await fetch(API_BASE_URL + '/matches/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Erro ao criar partida (HTTP ${res.status}). ${text}`)
    }

    router.push({name: 'home'})
  } catch (e) {
    error.value = e?.message ?? 'Falha ao enviar'
  } finally {
    submitting.value = false
  }
}
</script>