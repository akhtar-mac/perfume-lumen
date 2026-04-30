import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

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

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      set({ session, user, isLoading: !user }); // If no user, we are done loading. If user, we fetch profile.
      if (user) {
        get().fetchProfile(user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      set({ session, user });
      if (user) {
        get().fetchProfile(user.id);
      } else {
        set({ profile: null, isLoading: false });
      }
    });
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data && !error) {
      set({ profile: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    
    set({ profile: { ...profile, ...data } });
    await supabase.from('profiles').update(data).eq('id', user.id);
  },

  toggleWishlist: async (productId: number) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    
    let newWishlist = [...(profile.wishlist || [])];
    if (newWishlist.includes(productId)) {
      newWishlist = newWishlist.filter(id => id !== productId);
    } else {
      newWishlist.push(productId);
    }
    
    set({ profile: { ...profile, wishlist: newWishlist } });
    await supabase.from('profiles').update({ wishlist: newWishlist }).eq('id', user.id);
  },

  signOut: async () => {
    await supabase.auth.signOut();
  }
}));
