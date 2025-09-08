export const carrinhoStore = {
  carrinho: [],
  add(produto) {
    const itemExistente = this.carrinho.find(p => p.id === produto.id)
    if (itemExistente) {
      itemExistente.quantidade += produto.quantidade
    } else {
      this.carrinho.push({ ...produto }) // já contém quantidade
    }
  },
  update(produto) {
    const itemExistente = this.carrinho.find(p => p.id === produto.id)
    if (itemExistente) {
      itemExistente.quantidade = produto.quantidade
    }
  },
  remove(produto) {
    this.carrinho = this.carrinho.filter(p => p.id !== produto.id)
  },
  getAll() {
    return this.carrinho
  }
}
