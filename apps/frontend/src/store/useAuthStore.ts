import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Address {
  id: string;
  type: 'home' | 'office' | 'other';
  name: string;
  email: string;
  phone?: string;
  receiverName?: string;
  receiverPhone?: string;
  street1: string;
  street2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  addresses: Address[];
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
  addAddress: (address: Omit<Address, 'id' | 'isDefault'>) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      set({ session, user, isLoading: !user });
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
      // Migration logic: handle old single 'address' field
      let processedData = { ...data };
      if (data.address && !data.addresses) {
        const migratedAddress: Address = {
          ...data.address,
          id: 'default-id',
          type: 'home',
          isDefault: true
        };
        processedData.addresses = [migratedAddress];
        delete processedData.address;
        
        // Save migration to DB
        await supabase.from('profiles').update({ 
          addresses: processedData.addresses,
          address: null 
        }).eq('id', userId);
      } else if (!data.addresses) {
        processedData.addresses = [];
      }
      
      set({ profile: processedData, isLoading: false });
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

  addAddress: async (newAddressData) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const newAddress: Address = {
      ...newAddressData,
      id: Math.random().toString(36).substr(2, 9),
      isDefault: profile.addresses.length === 0
    };

    const updatedAddresses = [...profile.addresses, newAddress];
    await get().updateProfile({ addresses: updatedAddresses });
  },

  deleteAddress: async (addressId) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const updatedAddresses = profile.addresses.filter(a => a.id !== addressId);
    
    // If we deleted the default, set the first remaining one as default
    if (profile.addresses.find(a => a.id === addressId)?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    await get().updateProfile({ addresses: updatedAddresses });
  },

  setDefaultAddress: async (addressId) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const updatedAddresses = profile.addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId
    }));

    await get().updateProfile({ addresses: updatedAddresses });
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
