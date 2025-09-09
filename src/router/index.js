import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase.js'
import Login from '../components/login.vue'  // L maiúsculo
import ProdutosCliente from '../components/ProdutosCliente.vue'
import Carrinho from '../components/Carrinho.vue'
import ClientePedidos from '../components/ClientePedidos.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/produtos/lista', component: ProdutosCliente, meta: { requiresAuth: true } },
  { path: '/carrinho', component: Carrinho, meta: { requiresAuth: true } },
  { path: '/clientePedidos', component: ClientePedidos, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Middleware: protege rotas que exigem login
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (to.meta.requiresAuth && !session) {
    return next('/login')
  }
  next()
})

export default router
