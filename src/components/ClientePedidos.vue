<template>
  <div class="app-container">
    <h1>Meus Pedidos</h1>

    <!-- Filtro por status -->
    <div class="filtro">
      <label for="statusFiltro">Filtrar:</label>
      <select v-model="statusFiltro" id="statusFiltro">
        <option value="">Todos</option>
        <option v-for="s in statusDisponiveis" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="pedidosFiltrados.length === 0">
      <p>Você ainda não fez nenhum pedido.</p>
    </div>

    <div class="lista-pedidos">
      <div v-for="pedido in pedidosFiltrados" :key="pedido.id" class="pedido-card">
        <h3>Pedido #{{ pedido.id }}</h3>
        <p><strong>Data:</strong> {{ formatarData(pedido.data_pedido) }}</p>
        <p><strong>Entrega:</strong> {{ formatarData(pedido.data_entrega) }}</p>
        <p><strong>Status:</strong> <span :class="'status ' + pedido.status.toLowerCase()">{{ pedido.status }}</span></p>
        <p><strong>Total:</strong> R$ {{ formatarPreco(pedido.valor_total) }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js'

export default {
  name: 'PedidosCliente',
  data() {
    return {
      pedidos: [],
      cliente: null,
      statusFiltro: '',
      statusDisponiveis: ['Aberto', 'Confirmado', 'Separacao', 'Rota', 'Entregue', 'Cancelado']
    }
  },
  computed: {
    pedidosFiltrados() {
      if (!this.statusFiltro) return this.pedidos
      return this.pedidos.filter(p => p.status === this.statusFiltro)
    }
  },
  async created() {
    // pegar cliente logado
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('Usuário não logado!')
      return
    }

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('Erro ao buscar cliente:', error.message)
      return
    }

    this.cliente = cliente

    // buscar pedidos do cliente
    const { data: pedidos, error: errPedidos } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_cliente', cliente.id)
      .order('data_pedido', { ascending: false })

    if (errPedidos) {
      console.error('Erro ao buscar pedidos:', errPedidos.message)
      return
    }

    this.pedidos = pedidos
  },
  methods: {
    formatarPreco(valor) {
      if (!valor) return '0,00'
      return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(valor)
    },
    formatarData(data) {
      if (!data) return ''
      const d = new Date(data)
      if (isNaN(d)) return ''
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.filtro {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filtro select {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pedido-card {
  background: #fff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.status {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
}

.status.aberto { background: #f1c40f; color: #fff; }
.status.confirmado { background: #27ae60; color: #fff; }
.status.separacao { background: #2980b9; color: #fff; }
.status.rota { background: #8e44ad; color: #fff; }
.status.entregue { background: #2ecc71; color: #fff; }
.status.cancelado { background: #e74c3c; color: #fff; }
</style>
