import { makeAutoObservable } from "mobx";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

class CartStore {
  items: CartItem[] = [];

  constructor() {
    // Torna tudo observável e as funções em ações automaticamente
    makeAutoObservable(this);
  }

  // Ação para adicionar item
  addItem(item: Omit<CartItem, "quantity">) {
    const existingItem = this.items.find((i) => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({ ...item, quantity: 1 });
    }
  }

  // Ação para remover item
  removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
  }

  // Getter (Computado) - Valor total do carrinho
  get totalValue() {
    return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  // Getter (Computado) - Total de itens
  get totalItems() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  // Ação para limpar carrinho
  clearCart() {
    this.items = [];
  }
}

// Exportamos apenas a INSTÂNCIA (Singleton)
export const cartStore = new CartStore();
