<template>
  <div class="app-container">
    <h1>Produtos</h1>

    <!-- ALERTA TOAST -->
    <div v-if="alerta.mostrar" :class="['alerta-toast', alerta.tipo]">
      {{ alerta.mensagem }}
    </div>

    <!-- Campo de busca -->
    <div class="filtro">
      <input
        type="text"
        v-model="filtroNome"
        placeholder="Pesquisar produto..."
      />
    </div>

    <!-- Grid de produtos -->
    <div class="lista-grid">
      <div
        v-for="produto in produtosDisponiveis"
        :key="produto.id"
        class="card-item"
      >
        <h4>{{ produto.nome }}</h4>
        <p>Preço: {{ formatarPreco(produto.preco) }}</p>
        <p>Unidade: {{ produto.unidade }}</p>
        <button @click="abrirModal(produto)">Adicionar ao carrinho</button>
      </div>
    </div>

    <p v-if="produtosDisponiveis.length === 0">Nenhum produto encontrado.</p>

    <!-- Modal -->
    <div v-if="modalAberto" class="modal-overlay">
      <div class="modal-box">
        <h3>{{ produtoSelecionado.nome }}</h3>
        <p>Preço unitário: {{ formatarPreco(produtoSelecionado.preco) }}</p>

        <label>
          Quantidade (kg):
          <input 
            type="number" 
            v-model.number="quantidade" 
            placeholder="Ex: 0,5 para 500g" 
            min="0.1" 
            step="0.1"
          />
        </label>

        <p v-if="quantidade && quantidade > 0">
          Total: {{ formatarPreco(produtoSelecionado.preco * quantidade) }}
        </p>

        <div class="modal-buttons">
          <button @click="fecharModal" class="cancel">Cancelar</button>
          <button @click="confirmarCarrinho" :disabled="!quantidade || quantidade <= 0">Adicionar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase.js'
import { carrinhoStore } from '../store/carrinho.js'

export default {
  name: 'ProdutosCliente',
  data() {
    return {
      produtos: [],
      erro: null,
      modalAberto: false,
      produtoSelecionado: null,
      quantidade: null,
      filtroNome: '',
      alerta: { mostrar: false, mensagem: '', tipo: 'sucesso' } // TOAST
    }
  },
  computed: {
    produtosDisponiveis() {
      return this.produtos
        .filter(p => p.estoque > 0)
        .filter(p => 
          p.nome.toLowerCase().includes(this.filtroNome.toLowerCase())
        )
    }
  },
  async created() {
    try {
      const { data, error } = await supabase.from('produtos').select('*')
      if (error) throw error
      this.produtos = data
    } catch (err) {
      this.mostrarAlerta('Erro ao carregar produtos: ' + err.message, 'erro')
    }
  },
  methods: {
    formatarPreco(valor) {
      if (!valor) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor)
    },
    abrirModal(produto) {
      this.produtoSelecionado = produto
      this.quantidade = null
      this.modalAberto = true
    },
    fecharModal() {
      this.modalAberto = false
      this.produtoSelecionado = null
      this.quantidade = null
    },
    confirmarCarrinho() {
      if (!this.quantidade || this.quantidade < 0.1) {
        this.mostrarAlerta('Digite uma quantidade válida em kg (mínimo 0,1kg).', 'erro')
        return
      }
      carrinhoStore.add({ ...this.produtoSelecionado, quantidade: this.quantidade })
      this.mostrarAlerta(`${this.produtoSelecionado.nome} adicionado ao carrinho!`, 'sucesso')
      this.fecharModal()
    },
    mostrarAlerta(mensagem, tipo = 'sucesso') {
      this.alerta = { mostrar: true, mensagem, tipo }
      setTimeout(() => {
        this.alerta.mostrar = false
      }, 2500)
    }
  }
}
</script>

<style scoped>
.filtro {
  margin-bottom: 20px;
}

.filtro input {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

.modal-box input {
  width: 100%;
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

/* TOAST */
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

.alerta-toast.sucesso {
  background-color: #1abc9c;
}

.alerta-toast.erro {
  background-color: #e74c3c;
}

@keyframes slide-down {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
</style>
