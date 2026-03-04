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
            <h2>Games</h2>
          </div>
        </template>

        <div class="gameList">
          <div v-if="loading" class="empty">
            Carregando partidas...
          </div>

          <div v-else-if="error" class="empty">
            {{ error }}
          </div>

          <div v-else>
            <div v-for="g in games" :key="g.id" class="gameRow">
              <div class="gameRow__left">
                <div class="gameRow__name">
                  {{ g.campaign?.name || 'Sem campanha' }}
                </div>

                <div class="gameRow__meta">
                  <span class="pill" :class="difficultClass(g.difficult)">
                    {{ g.difficult || '—' }}
                  </span>

                  <span class="muted">Players: {{ g.players?.length ?? 0 }}</span>
                  <span class="muted">
                    {{ (g.players ?? []).map(p => p.name).filter(Boolean).join(', ') || '—' }}
                  </span>
                </div>
              </div>

              <div class="gameRow__actions">
                <button class="btn btn--primary" type="button" @click="startGame(g)">
                  Iniciar partida
                </button>

                <button class="btn btn--secondary" type="button" @click="continueGame(g)">
                  Continuar partida
                </button>

                <button class="btn btn--ghost" type="button" @click="editPlayers(g)">
                  Editar jogadores
                </button>

                <button class="btn btn--danger" type="button" @click="deleteGame(g)">
                  Excluir
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
            Criar partida
          </button>

          <button class="btn btn--ghost" type="button" @click="loadGames" :disabled="loading">
            Atualizar lista
          </button>

          <div class="hint muted">
            Esta tela é a página inicial do sistema.
            Ao iniciar/continuar, abrimos o HUD do jogo.
          </div>
        </div>
      </FramePanel>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FramePanel from '../components/FramePanel.vue'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const games = ref([])

function difficultClass(difficult) {
  if (difficult === 'EASY') return 'pill--blue'
  if (difficult === 'NORMAL') return 'pill--orange'
  if (difficult === 'HARD') return 'pill--red'
  return 'pill--muted'
}

async function loadGames() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('http://localhost:8080/matches/all', { method: 'GET' })
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

function startGame(game) {
  router.push({ name: 'game' })
}

function continueGame(game) {
  router.push({ name: 'game' })
}

function editPlayers(game) {
  alert(`Editar jogadores: ${game?.campaign?.name ?? game?.id ?? ''}`)
}

function deleteGame(game) {
  alert('Excluir ainda não implementado no backend.')
}

function goCreateMatch() {
  router.push({ name: 'match-create' })
}

onMounted(loadGames)
</script>

<style scoped>
.pill--red {
  background: rgba(255, 59, 59, .20);
  color: #ffd0d0;
}

.home {
  display: grid;
  gap: 12px;
}

.banner {
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, .10);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .35) inset;

  /* ajuda quando usar contain (barras laterais ficam ok) */
  background: rgba(0, 0, 0, .22);
  display: grid;
  place-items: center;
}

.banner__img {
  width: 100%;
  height: clamp(140px, 18vw, 260px);
  object-fit: contain; /* NÃO corta no PC */
  object-position: center;
  display: block;
}

/* Em telas menores pode manter contain também (fica consistente) */
@media (max-width: 1100px) {
  .banner__img {
    height: clamp(120px, 28vw, 180px);
  }
}

.home__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 2.2fr 1fr;
  align-items: start;
}

@media (max-width: 1100px) {
  .home__grid {
    grid-template-columns: 1fr;
  }

  .banner__img {
    height: 160px;
  }
}

.homeTitle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.homeTitle h2 {
  font-size: 54px;
}

.gameList {
  display: grid;
  gap: 12px;
}

.gameRow {
  border-radius: var(--radiusSmall);
  border: 2px solid rgba(0, 0, 0, .70);
  background: radial-gradient(120% 140% at 50% 0%, rgba(255, 255, 255, .12), rgba(255, 255, 255, 0) 46%),
  linear-gradient(180deg, #7a0015, #260008);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .05) inset;

  padding: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr auto;
  align-items: center;
}

@media (max-width: 900px) {
  .gameRow {
    grid-template-columns: 1fr;
  }
}

.gameRow__name {
  font-family: "Bebas Neue", system-ui, sans-serif;
  font-size: 20px;
  line-height: 1;
}

.gameRow__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  align-items: center;
}

.gameRow__actions {
  display: grid;
  grid-auto-flow: column;
  gap: 10px;
  align-items: center;
}

@media (max-width: 900px) {
  .gameRow__actions {
    grid-auto-flow: row;
  }
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  font-size: 12px;
  border: 2px solid rgba(0, 0, 0, .45);
}

.pill--blue {
  background: rgba(47, 137, 255, .20);
  color: #cfe2ff;
}

.pill--orange {
  background: rgba(255, 139, 47, .20);
  color: #ffe0c7;
}

.pill--muted {
  background: rgba(255, 255, 255, .10);
  color: rgba(255, 255, 255, .80);
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

.btn--secondary {
  background: linear-gradient(#5a5a5a, #2c2c2c);
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

.sideActions {
  display: grid;
  gap: 12px;
}

.hint {
  padding-top: 6px;
  font-weight: 700;
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

.muted {
  color: var(--muted);
}
</style>