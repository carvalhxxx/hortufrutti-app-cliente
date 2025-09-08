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
          <input
            type="number"
            v-model.number="item.quantidade"
            min="0.1"
            step="0.1"
            @change="atualizarItem(item)"
          />
          <span v-if="item.unidade === 'kg'">kg</span>
          <span v-else>un</span>
        </label>

        <p>Total: {{ formatarPreco(item.preco * item.quantidade) }}</p>

        <button @click="removerItem(item)">Remover</button>
      </div>

      <div class="total-geral">
        <h3>Total Geral: {{ formatarPreco(totalGeral) }}</h3>
        <button @click="mostrarModal = true">Finalizar Pedido</button>
      </div>
    </div>

    <!-- Modal de confirmação -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Confirmar Pedido</h2>
        <p>Deseja realmente finalizar o pedido?</p>
        <p><strong>Total: {{ formatarPreco(totalGeral) }}</strong></p>
        <div class="modal-actions">
          <button @click="finalizarPedido">Confirmar</button>
          <button class="cancel" @click="mostrarModal = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { carrinhoStore } from '../store/carrinho.js'

export default {
  name: 'CarrinhoCliente',
  data() {
    return {
      carrinho: [],
      mostrarModal: false
    }
  },
  computed: {
    totalGeral() {
      return this.carrinho.reduce(
        (acc, item) => acc + item.preco * item.quantidade,
        0
      )
    }
  },
  created() {
    this.carrinho = carrinhoStore.getAll()
  },
  methods: {
    formatarPreco(valor) {
      if (!valor) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor)
    },
    atualizarItem(item) {
      if (item.quantidade <= 0) {
        item.quantidade = 0.1
      }
      carrinhoStore.update(item)
    },
    removerItem(item) {
      carrinhoStore.remove(item)
      this.carrinho = carrinhoStore.getAll()
    },
    finalizarPedido() {
      alert('Pedido finalizado com sucesso!')
      this.mostrarModal = false
      carrinhoStore.clear()
      this.carrinho = []
    }
  }
}
</script>

<style>
/* deixa no global, sem scoped, pra sobrepor tudo */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* bem alto */
}
.modal-content {
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 350px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.modal-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}
.modal-actions .cancel {
  background: #e74c3c;
}
</style>
