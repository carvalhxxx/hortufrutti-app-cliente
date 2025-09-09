<template>
  <div class="app-container">
    <h1>Meu Carrinho</h1>

    <div v-if="carrinho.length === 0">
      <p>Seu carrinho está vazio.</p>
    </div>

    <div v-else class="lista-grid">
      <div v-for="item in carrinho" :key="item.id" class="card-item">
        <h4>{{ item.nome }}</h4>
        <p>Preço unitário: {{ formatarPreco(item.preco) }}</p>

        <label>
          Quantidade:
          <input type="number" v-model.number="item.quantidade" min="0.1" step="0.1" @change="atualizarItem(item)" />
          <span v-if="item.unidade === 'kg'"> kg</span>
          <span v-else>un</span>
        </label>

        <p>Total: {{ formatarPreco(item.preco * item.quantidade) }}</p>

        <button @click="removerItem(item)">Remover</button>
      </div>

      <div class="total-geral">
        <h3>Total Geral: {{ formatarPreco(totalGeral) }}</h3>
        <button @click="abrirFinalizacao">Finalizar Pedido</button>
      </div>
    </div>

    <!-- Modal de Finalização -->
    <div v-if="modalFinalizacaoAberto" class="modal-overlay">
      <div class="modal-box">
        <h3>Finalizar Pedido</h3>
        <label>
          Observações:
          <textarea v-model="observacoes" placeholder="Digite alguma observação..."></textarea>
        </label>
        <p>Data de entrega prevista: {{ formatarData(dataEntrega) }}</p>

        <div class="modal-buttons">
          <button @click="confirmarPedido">Confirmar Pedido</button>
          <button @click="fecharModalFinalizacao" class="cancel">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { carrinhoStore } from '../store/carrinho.js'
import { supabase } from '../supabase.js'

export default {
  name: 'CarrinhoCliente',
  data() {
    return {
      carrinho: [],
      modalFinalizacaoAberto: false,
      observacoes: '',
      dataEntrega: null,
      clienteLogadoId: null
    }
  },
  computed: {
    totalGeral() {
      return this.carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
    }
  },
  async created() {
    this.carrinho = carrinhoStore.getAll()

    // Buscar cliente logado
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('Usuário não logado!')
      return
    }

    const userEmail = session.user.email
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (error) {
      console.error('Erro ao buscar cliente logado:', error.message)
      return
    }

    this.clienteLogadoId = cliente.id
  },
  methods: {
    formatarPreco(valor) {
      if (!valor) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    },
    atualizarItem(item) {
      if (item.quantidade <= 0) item.quantidade = 0.1
      carrinhoStore.update(item)
    },
    removerItem(item) {
      carrinhoStore.remove(item)
      this.carrinho = carrinhoStore.getAll()
    },
    abrirFinalizacao() {
      if (this.carrinho.length === 0) {
        alert('Carrinho vazio.')
        return
      }
      this.observacoes = ''
      this.dataEntrega = this.calcularProximaEntrega()
      this.modalFinalizacaoAberto = true
    },
    fecharModalFinalizacao() {
      this.modalFinalizacaoAberto = false
    },
    calcularProximaEntrega() {
      const hoje = new Date()
      const diaSemana = hoje.getDay() // 0=domingo ... 6=sábado
      let diasParaAdicionar = 0

      if ([2,4,6,0].includes(diaSemana)) { // Terça, Quinta, Sábado, Domingo
        diasParaAdicionar = 1
      } else if (diaSemana === 1) { // Segunda
        diasParaAdicionar = 2
      } else if (diaSemana === 3) { // Quarta
        diasParaAdicionar = 2
      } else if (diaSemana === 5) { // Sexta
        diasParaAdicionar = 3
      }

      const entrega = new Date()
      entrega.setDate(hoje.getDate() + diasParaAdicionar)
      return entrega
    },
    formatarData(data) {
      if (!data) return ''
      const d = new Date(data)
      const dia = String(d.getDate()).padStart(2,'0')
      const mes = String(d.getMonth()+1).padStart(2,'0')
      const ano = d.getFullYear()
      return `${dia}/${mes}/${ano}`
    },
        async confirmarPedido() {
      try {
        if (!this.clienteLogadoId) {
          alert('Cliente logado não encontrado!')
          return
        }

        // Função para ajustar data/hora para Brasília e gerar ISO correto
        const toBrasiliaTimestamp = (date) => {
          const d = new Date(date)
          // Ajusta para UTC subtraindo o deslocamento do fuso horário
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
        }

        const dataPedidoBR = toBrasiliaTimestamp(new Date())
        const dataEntregaBR = toBrasiliaTimestamp(this.dataEntrega)

        // Inserir pedido com valor total
        const { data: pedidoCriado, error: errPedido } = await supabase
          .from('pedidos')
          .insert([{
            id_cliente: this.clienteLogadoId,
            status: 'Aberto',
            data_pedido: dataPedidoBR,
            data_entrega: dataEntregaBR,
            observacoes: this.observacoes,
            valor_total: this.totalGeral
          }])
          .select()
        if (errPedido) throw errPedido

        const pedidoId = pedidoCriado[0].id

        // Inserir itens do pedido
        const itensParaInserir = this.carrinho.map(item => ({
          id_pedido: pedidoId,
          id_produto: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        }))

        const { error: errItens } = await supabase
          .from('itens_pedido')
          .insert(itensParaInserir)
        if (errItens) throw errItens

        alert('Pedido finalizado com sucesso!')
        carrinhoStore.clear()
        this.carrinho = []
        this.fecharModalFinalizacao()
      } catch (err) {
        alert('Erro ao finalizar pedido: ' + err.message)
      }
    }


  }
}
</script>


<style scoped>
.lista-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
  gap: 20px;
}
.card-item {
  background-color: #fff;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card-item input {
  width: 80px;
  padding: 5px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.total-geral {
  margin-top: 20px;
  grid-column: 1 / -1;
  text-align: right;
}
.total-geral button {
  margin-top: 10px;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  background-color: #1abc9c;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.total-geral button:hover {
  background-color: #16a085;
}

.modal-overlay {
  position: fixed;
  top:0; left:0;
  width: 100%; height:100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-box {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-box textarea {
  width: 100%;
  height: 60px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
}

.modal-buttons .cancel {
  background-color: #ccc;
  color: #333;
}

.modal-buttons button:hover {
  opacity: 0.9;
}
</style>
