import { create } from 'zustand';

export interface CartItem {
  id: number;
  title: string;
  price: number; // numeric price
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addToCart: (newItem) => set((state) => {
    const existingItem = state.items.find(item => item.id === newItem.id);
    if (existingItem) {
      return {
        items: state.items.map(item =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { items: [...state.items, { ...newItem, quantity: 1 }] };
  }),
  removeFromCart: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  updateQuantity: (id, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(item => item.id !== id) };
    }
    return {
      items: state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    };
  }),
  clearCart: () => set({ items: [] }),
  getCartTotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
  getCartCount: () => get().items.reduce((count, item) => count + item.quantity, 0)
}));
