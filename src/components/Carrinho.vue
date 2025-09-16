<template>
  <div class="app-container">
    <h1>Meu Carrinho</h1>

    <!-- ALERTA TOAST -->
    <div v-if="alerta.mostrar" :class="['alerta-toast', alerta.tipo]">
      {{ alerta.mensagem }}
    </div>

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
      clienteLogadoId: null,

      // ALERTA TOAST
      alerta: { mostrar: false, mensagem: '', tipo: 'sucesso' }
    }
  },
  computed: {
    totalGeral() {
      return this.carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
    }
  },
  async created() {
    this.carrinho = carrinhoStore.getAll()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      this.mostrarAlerta('Usuário não logado!', 'erro')
      return
    }

    const userEmail = session.user.email
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (error) {
      this.mostrarAlerta('Erro ao buscar cliente logado', 'erro')
      return
    }

    this.clienteLogadoId = cliente.id
  },
  methods: {
    mostrarAlerta(mensagem, tipo = 'sucesso') {
      this.alerta = { mostrar: true, mensagem, tipo }
      setTimeout(() => { this.alerta.mostrar = false }, 2500)
    },
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
      this.mostrarAlerta('Item removido do carrinho', 'sucesso')
    },
    abrirFinalizacao() {
      if (this.carrinho.length === 0) {
        this.mostrarAlerta('Carrinho vazio', 'erro')
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
      const diaSemana = hoje.getDay()
      let diasParaAdicionar = 0

      if ([2,4,6,0].includes(diaSemana)) diasParaAdicionar = 1
      else if (diaSemana === 1) diasParaAdicionar = 2
      else if (diaSemana === 3) diasParaAdicionar = 2
      else if (diaSemana === 5) diasParaAdicionar = 3

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
          this.mostrarAlerta('Cliente logado não encontrado!', 'erro')
          return
        }

        const toBrasiliaTimestamp = (date) => {
          const d = new Date(date)
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
        }

        const dataPedidoBR = toBrasiliaTimestamp(new Date())
        const dataEntregaBR = toBrasiliaTimestamp(this.dataEntrega)

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

        const itensParaInserir = this.carrinho.map(item => ({
          id_pedido: pedidoId,
          id_produto: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        }))

        const { error: errItens } = await supabase.from('itens_pedido').insert(itensParaInserir)
        if (errItens) throw errItens

        this.mostrarAlerta('Pedido finalizado com sucesso!', 'sucesso')
        carrinhoStore.clear()
        this.carrinho = []
        this.fecharModalFinalizacao()
      } catch (err) {
        this.mostrarAlerta('Erro ao finalizar pedido: ' + err.message, 'erro')
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

/* ALERTA FIXO TOAST */
.alerta-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  animation: slide-down 0.3s ease;
}
.alerta-toast.sucesso { background-color: #1abc9c; }
.alerta-toast.erro { background-color: #e74c3c; }
@keyframes slide-down {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
</style>
