import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  shipping_fee: number;
  items: OrderItem[];
  coupon_code?: string;
}

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  subscribeToOrders: () => (() => void);
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false });

    if (data && !error) {
      set({ orders: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  subscribeToOrders: () => {
    const user = useAuthStore.getState().user;
    if (!user) return () => {};

    // Remove any existing channels with the same name to prevent duplicates
    supabase.getChannels().forEach(channel => {
      if (channel.topic === 'realtime:public:orders') {
        supabase.removeChannel(channel);
      }
    });

    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.uid}` },
        (payload) => {
          set((state) => ({
            orders: state.orders.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
