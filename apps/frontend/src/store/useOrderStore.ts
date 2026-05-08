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
  items: OrderItem[];
}

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  subscribeToOrders: () => (() => void);
  createOrder: (total: number, items: OrderItem[], appliedCouponCode?: string) => Promise<void>;
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
      .eq('user_id', user.id)
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
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
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

  createOrder: async (total, items, appliedCouponCode) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // DEMO BYPASS: If this is the fake demo user, just mock the order creation
    // so we don't hit Row Level Security (RLS) errors from Supabase
    if (user.id === 'demo-user-123') {
      const mockOrder: Order = {
        id: `DEMO-ORD-${Math.floor(Math.random() * 10000)}`,
        created_at: new Date().toISOString(),
        total,
        status: 'Paid',
        items
      };
      
      set((state) => ({ orders: [mockOrder, ...state.orders] }));
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total,
        items,
        status: 'Paid',
        coupon_code: appliedCouponCode || null
      })
      .select()
      .single();

    if (data && !error) {
      set((state) => ({ orders: [data, ...state.orders] }));
      
      // Increment coupon usage if one was applied
      if (appliedCouponCode) {
        // Fetch current uses first (or use RPC)
        const { data: couponData } = await supabase.from('coupons').select('current_uses').eq('code', appliedCouponCode).single();
        if (couponData) {
          await supabase.from('coupons').update({ current_uses: couponData.current_uses + 1 }).eq('code', appliedCouponCode);
        }
      }
    }
  }
}));
