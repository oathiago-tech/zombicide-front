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
            <label class="label">Dificuldade</label>
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
                Adicionar jogador
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
                  <label class="label">Nome real do jogador</label>
                  <input
                      v-model.trim="p.name"
                      class="input"
                      type="text"
                      placeholder="Ex.: Thiago"
                      required
                  />
                </div>

                <div class="field">
                  <label class="label">Personagem</label>
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
              Adicione até 6 jogadores. Cada personagem pode ser escolhido apenas uma vez.
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

          <div v-if="lastPayload" class="payloadBox">
            <div class="payloadBox__title">Payload enviado (mock):</div>
            <pre class="payloadBox__pre">{{ lastPayload }}</pre>
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
            Endpoint (mock):
            <div class="mono">POST http://localhost:8080/match/create</div>
          </div>

          <div class="muted">
            Tags disponíveis:
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

const router = useRouter()

/**
 * Associação imagem -> TAG (como você pediu)
 */
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

/**
 * players: [{ id, name, character }]
 */
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

/**
 * Mock de chamada pro backend (deixa pronto pro endpoint real)
 */
async function submit() {
  error.value = ''
  lastPayload.value = ''

  const payload = {
    campaign: campaign.value,
    players: players.map(p => ({
      name: p.name,
      character: p.character
    })),
    difficult: difficult.value
  }

  lastPayload.value = JSON.stringify(payload, null, 2)

  submitting.value = true
  try {
    const res = await fetch('http://localhost:8080/match/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Erro HTTP ${res.status}. ${text}`)
    }

    // Futuro: pegar o id da match retornada e navegar /game/:id
    // Por enquanto: abre o HUD
    router.push({name: 'game'})
  } catch (e) {
    error.value = e?.message ?? 'Falha ao enviar'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create {
  display: grid;
  gap: 12px;
}

.banner {
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, .10);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .35) inset;
  background: rgba(0, 0, 0, .22);
  display: grid;
  place-items: center;
}

.banner__img {
  width: 100%;
  height: clamp(140px, 18vw, 260px);
  object-fit: contain;
  object-position: center;
  display: block;
}

.create__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 2.2fr 1fr;
  align-items: start;
}

@media (max-width: 1100px) {
  .create__grid {
    grid-template-columns: 1fr;
  }

  .banner__img {
    height: clamp(120px, 28vw, 180px);
  }
}

.titleCenter {
  display: flex;
  align-items: center;
  justify-content: center;
}

.titleCenter h2 {
  font-size: 54px;
}

.form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-size: 12px;
  color: rgba(255, 255, 255, .82);
}

.input,
.select {
  height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, .65);
  background: rgba(0, 0, 0, .22);
  color: rgba(255, 255, 255, .92);
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .06) inset;
  font-weight: 700;
}

.input::placeholder {
  color: rgba(255, 255, 255, .45);
}

.playersHeader {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.playersHeader__title {
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 34px;
  line-height: 1;
  margin: 0;
}

.playersList {
  display: grid;
  gap: 12px;
}

.playerRow {
  border-radius: var(--radiusSmall);
  border: 2px solid rgba(0, 0, 0, .70);
  background: radial-gradient(120% 140% at 50% 0%, rgba(255, 255, 255, .12), rgba(255, 255, 255, 0) 46%),
  linear-gradient(180deg, #7a0015, #260008);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .05) inset;

  padding: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
}

@media (max-width: 700px) {
  .playerRow {
    grid-template-columns: 1fr;
  }
}

.playerRow__portrait {
  width: 90px;
  height: 90px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, .12);
  background: rgba(0, 0, 0, .25);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.portrait__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.portrait__empty {
  color: rgba(255, 255, 255, .55);
  font-weight: 900;
  font-size: 18px;
}

.playerRow__fields {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 12px;
}

@media (max-width: 900px) {
  .playerRow__fields {
    grid-template-columns: 1fr;
  }
}

.playerRow__actions {
  display: grid;
  justify-items: end;
}

@media (max-width: 700px) {
  .playerRow__actions {
    justify-items: stretch;
  }
}

.formActions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding-top: 8px;
}

@media (max-width: 700px) {
  .formActions {
    grid-template-columns: 1fr;
  }
}

.btn {
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  font-weight: 800;
  letter-spacing: .02em;
  color: white;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, .55);
}

.btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.btn--primary {
  background: linear-gradient(#0f64cf, var(--blue));
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 24px;
}

.btn--ghost {
  background: rgba(0, 0, 0, .20);
  border: 2px solid rgba(255, 255, 255, .12);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .55);
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 22px;
}

.btn--danger {
  background: linear-gradient(#c9132b, #650013);
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 24px;
}

.btn--big {
  height: 54px;
  font-size: 30px;
}

.empty {
  padding: 16px;
  color: rgba(255, 255, 255, .70);
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  border: 2px dashed rgba(255, 255, 255, .18);
  border-radius: 14px;
}

.errorBox {
  border: 2px solid rgba(255, 80, 80, .35);
  background: rgba(255, 0, 0, .12);
  padding: 12px;
  border-radius: 12px;
  font-weight: 800;
}

.payloadBox {
  border: 2px solid rgba(255, 255, 255, .12);
  background: rgba(0, 0, 0, .18);
  padding: 12px;
  border-radius: 12px;
}

.payloadBox__title {
  font-weight: 900;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-size: 12px;
  color: rgba(255, 255, 255, .82);
  margin-bottom: 8px;
}

.payloadBox__pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: rgba(255, 255, 255, .86);
  font-size: 12px;
}

.info {
  display: grid;
  gap: 12px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
}

.tagPill {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 2px solid rgba(0, 0, 0, .45);
  background: rgba(255, 255, 255, .10);
  color: rgba(255, 255, 255, .85);
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
  font-size: 12px;
}

.muted {
  color: var(--muted);
}
x
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, .85);
  padding-top: 6px;
}
</style>