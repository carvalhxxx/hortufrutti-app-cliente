import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase.js'
import Login from '../components/LoginCliente.vue'
import ProdutosCliente from '../components/ProdutosCliente.vue'
import Carrinho from '../components/Carrinho.vue'
import ClientePedidos from '../components/ClientePedidos.vue'
import InicioApp from '../components/InicioApp.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/InicioApp', component: InicioApp, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/produtos/lista', component: ProdutosCliente, meta: { requiresAuth: true } },
  { path: '/carrinho', component: Carrinho, meta: { requiresAuth: true } },
  { path: '/clientePedidos', component: ClientePedidos, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guarda global: verifica autenticação
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && to.meta.requiresAuth) {
    // Se não está logado e tenta acessar rota protegida → login
    return next("/login")
  }

  if (session && to.path === "/login") {
    // Se já está logado e tenta acessar login → produtos
    return next("/login")
  }

  next()
})

export default router
