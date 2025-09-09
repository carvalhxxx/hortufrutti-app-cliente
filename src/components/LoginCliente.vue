<template>
  <div class="login-wrapper">
    <div class="login-box">
      <h2>{{ modo === 'login' ? 'Login' : 'Cadastro' }}</h2>

      <input v-model="nome" placeholder="Nome" v-if="modo === 'cadastro'" />
      <input v-model="email" placeholder="Email" type="email" />
      <input v-model="senha" type="password" placeholder="Senha" />

      <button v-if="modo === 'login'" @click="login">Entrar</button>
      <button v-else @click="signup">Cadastrar</button>

      <p class="alternar">
        {{ modo === 'login' ? 'Não tem conta?' : 'Já tem conta?' }}
        <a href="#" @click.prevent="alternarModo">
          {{ modo === 'login' ? 'Cadastrar' : 'Entrar' }}
        </a>
      </p>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </div>
  </div>
</template>

<script>
import { supabase } from "../supabase.js"

export default {
  name: "LoginCliente",
  data() {
    return {
      nome: "",
      email: "",
      senha: "",
      modo: "login",
      erro: null
    }
  },
  methods: {
    async signup() {
      this.erro = null
      if (!this.nome.trim() || !this.email.trim() || !this.senha) {
        this.erro = "Preencha todos os campos"
        return
      }

      try {
        // Cria usuário no Supabase Auth
        const { data: user, error } = await supabase.auth.signUp({
          email: this.email,
          password: this.senha
        })
        if (error) throw error

        // Cria registro do cliente no banco
        const { error: clienteError } = await supabase
          .from('clientes')
          .insert({
            nome: this.nome,
            email: this.email,
            id: user.user.id
          })
        if (clienteError) throw clienteError

        alert("Cadastro realizado! Faça login agora.")
        this.modo = "login"
        this.nome = ""
        this.email = ""
        this.senha = ""
      } catch (err) {
        this.erro = "Erro ao cadastrar: " + err.message
      }
    },

    async login() {
      this.erro = null
      if (!this.email.trim() || !this.senha) {
        this.erro = "Preencha todos os campos"
        return
      }

      try {
        // Autentica usuário
        const { data: session, error } = await supabase.auth.signInWithPassword({
          email: this.email,
          password: this.senha
        })
        if (error) {
          this.erro = "Email ou senha incorretos"
          return
        }

        // Busca o cliente correspondente
        const { data: cliente, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (clienteError) throw clienteError

        // Armazena cliente logado no localStorage ou em store
        localStorage.setItem('clienteLogado', JSON.stringify(cliente))

        alert("Login realizado com sucesso!")
        this.$router.push("/produtos")
      } catch (err) {
        this.erro = "Ocorreu um erro: " + err.message
      }
    },

    alternarModo() {
      this.modo = this.modo === "login" ? "cadastro" : "login"
      this.erro = null
    }
  }
}
</script>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
}
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
}
.login-box {
  background: white;
  padding: 30px 25px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  max-width: 350px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: center;
}
.login-box input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.login-box input:focus {
  outline: none;
  border-color: #1abc9c;
}
.login-box button {
  padding: 10px;
  border-radius: 6px;
  border: none;
  background-color: #1abc9c;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.login-box button:hover {
  background-color: #16a085;
}
.alternar {
  margin-top: 10px;
  font-size: 14px;
}
.alternar a {
  color: #1abc9c;
  cursor: pointer;
  text-decoration: none;
  font-weight: bold;
}
.erro {
  color: red;
  margin-top: 5px;
}
</style>
