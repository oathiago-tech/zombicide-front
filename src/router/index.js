import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameHud from '../views/GameHud.vue'
import MatchCreateView from '../views/MatchCreateView.vue'

const routes = [
    { path: '/', name: 'home', component: HomeView },
    { path: '/game', name: 'game', component: GameHud },
    { path: '/match/create', name: 'match-create', component: MatchCreateView },
]

export default createRouter({
    history: createWebHistory(),
    routes
})