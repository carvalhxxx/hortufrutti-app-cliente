import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/login.vue'  // L maiúsculo
import ProdutosCliente from '../components/ProdutosCliente.vue'
import Carrinho from '../components/Carrinho.vue'

const routes = [
  { path: '/login', component: Login },

    { path: '/produtos/lista', component: ProdutosCliente },
    { path: '/carrinho', component: Carrinho }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
