<template>
  <div id="app">
    <div class="container">

      <!-- Header fixo -->
      <header class="app-header">
        <!-- Botão hamburguer -->
        <button 
          v-if="logado" 
          class="toggle-btn" 
          @click="menuAberto = !menuAberto">
          ☰
        </button>

        <h1 class="titulo">Meu Sistema</h1>

        <!-- Removido botão de sair -->
        <div class="acoes"></div>
      </header>

      <!-- Overlay escuro (aparece quando menu aberto no mobile) -->
      <transition name="fade">
        <div 
          v-if="menuAberto" 
          class="overlay" 
          @click="menuAberto = false">
        </div>
      </transition>

      <!-- Menu lateral -->
      <nav v-if="logado" :class="['menu-lateral', { aberto: menuAberto }]">
        <transition name="slide">
          <button 
            v-if="menuAberto" 
            class="close-btn" 
            @click="menuAberto = false"
          >
            ✖
          </button>
        </transition>

        <transition-group name="slide" tag="ul">
          <li v-if="menuAberto" key="home">
            <router-link to="/" class="menu-link" active-class="ativo">
              🏠 <span>Início</span>
            </router-link>
          </li>
          <li v-if="menuAberto" key="produtos">
            <router-link to="/produtos/lista" class="menu-link" active-class="ativo">
              📦 <span>Produtos</span>
            </router-link>
          </li>
          <li v-if="menuAberto" key="carrinho">
              <router-link to="/carrinho" class="menu-link" active-class="ativo">
              📝 <span>Carrinho</span>
            </router-link>
          </li>
          <li v-if="menuAberto" key="sair">
            <button @click="logout" class="menu-link">
              🔒 <span>Sair</span>
            </button>
          </li>
        </transition-group>
      </nav>

      <!-- Conteúdo principal -->
      <main class="conteudo">
        <router-view></router-view>
      </main>
      
    </div>
  </div>
</template>

<script>
import { supabase } from "./supabase.js"

export default {
  name: 'App',
  data() {
    return {
      menuAberto: false,
      logado: false
    }
  },
  async created() {
    const { data: { session } } = await supabase.auth.getSession()
    this.logado = !!session

    supabase.auth.onAuthStateChange((_event, session) => {
      this.logado = !!session
      if (!this.logado) this.menuAberto = false
    })
  },
  methods: {
    async logout() {
      await supabase.auth.signOut()
      this.$router.push("/login")
    }
  }
}
</script>


<style>
/* =======================
   Header fixo
======================= */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #1abc9c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1300;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.app-header .titulo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  margin: 0;
}

.app-header .acoes {
  /* Mantido vazio já que o botão de sair foi removido */
}

/* =======================
   Botão hamburguer dentro do header
======================= */
.toggle-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

/* =======================
   Container principal
======================= */
.container {
  display: flex;
  height: 100vh;
  position: relative;
}

/* =======================
   Overlay escuro com fade
======================= */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 1050;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* =======================
   Menu lateral deslizante
======================= */
.menu-lateral {
  width: 220px;
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1100;
}

.menu-lateral.aberto {
  transform: translateX(0);
}

/* Slide animation para botões/links */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* Botão fechar dentro do menu */
.close-btn {
  align-self: flex-end;
  background: transparent;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  margin-bottom: 20px;
}

/* Links do menu */
.menu-lateral ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.menu-lateral li {
  margin-bottom: 15px;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.2s;
}

.menu-link span {
  flex: 1;
}

.menu-link:hover {
  background-color: #34495e;
}

.menu-link.ativo {
  background-color: #1abc9c;
  font-weight: bold;
}

/* =======================
   Conteúdo principal
======================= */
.conteudo {
  flex: 1;
  margin-left: 0;
  padding: 20px;
  padding-top: 80px; /* espaço para o header fixo */
  transition: margin-left 0.3s ease;
}

/* Desktop: desloca conteúdo quando menu aberto */
@media(min-width: 768px) {
  .conteudo {
    margin-left: 220px;
    padding-top: 80px; /* ajustado para header */
  }
}

/* Mobile: menu ocupa 70% da tela */
@media(max-width: 767px) {
  .menu-lateral {
    width: 70%;
  }
  .conteudo {
    margin-left: 0;
    padding-top: 80px; /* ajustado para header */
  }
}
</style>


