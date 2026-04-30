import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Coupon {
  code: string;
  discount_percentage: number;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
}

interface CouponStore {
  coupons: Coupon[];
  isLoading: boolean;
  fetchCoupons: () => Promise<void>;
  createCoupon: (code: string, discount_percentage: number, max_uses?: number | null) => Promise<boolean>;
  toggleCouponStatus: (code: string, currentStatus: boolean) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  validateCoupon: (code: string) => Promise<number | null>; // returns percentage or null
}

export const useCouponStore = create<CouponStore>((set) => ({
  coupons: [],
  isLoading: false,

  fetchCoupons: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      set({ coupons: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  createCoupon: async (code, discount_percentage, max_uses = null) => {
    const { data, error } = await supabase
      .from('coupons')
      .insert({ code: code.toUpperCase(), discount_percentage, max_uses, current_uses: 0, is_active: true })
      .select()
      .single();

    if (data && !error) {
      set((state) => ({ coupons: [data, ...state.coupons] }));
      return true;
    }
    return false;
  },

  toggleCouponStatus: async (code, currentStatus) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('code', code);
    set((state) => ({
      coupons: state.coupons.map(c => c.code === code ? { ...c, is_active: !currentStatus } : c)
    }));
  },

  deleteCoupon: async (code) => {
    await supabase.from('coupons').delete().eq('code', code);
    set((state) => ({
      coupons: state.coupons.filter(c => c.code !== code)
    }));
  },

  validateCoupon: async (code) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('discount_percentage, is_active, max_uses, current_uses')
      .eq('code', code.toUpperCase())
      .single();

    if (data && !error && data.is_active) {
      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        return null; // Limit reached
      }
      return data.discount_percentage;
    }
    return null;
  }
}));
