import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Address {
  name: string;
  email: string;
  street1: string;
  street2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  address: Address;
  wishlist: number[];
}

interface AdminUser {
  id: string;
  email?: string | null;
  phone?: string | null;
}

interface AuthStore {
  user: AdminUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,

  // Admin panel uses its own localStorage-based auth, not Supabase Auth.
  initialize: () => {
    set({ isLoading: false });
  },

  signOut: async () => {
    // No-op for admin — admin uses localStorage auth
  },

  updateProfile: async (data) => {
    const { profile } = get();
    if (!profile) return;
    set({ profile: { ...profile, ...data } });
    await supabase.from('profiles').update(data).eq('id', profile.id);
  },

  toggleWishlist: async (productId: number) => {
    const { profile } = get();
    if (!profile) return;

    let newWishlist = [...(profile.wishlist || [])];
    if (newWishlist.includes(productId)) {
      newWishlist = newWishlist.filter(id => id !== productId);
    } else {
      newWishlist.push(productId);
    }

    set({ profile: { ...profile, wishlist: newWishlist } });
    await supabase.from('profiles').update({ wishlist: newWishlist }).eq('id', profile.id);
  },
}));
