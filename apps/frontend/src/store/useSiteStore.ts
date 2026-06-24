import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface SiteStore {
  heroMediaUrl: string;
  heroMediaType: 'image' | 'video';
  
  // Content Customization
  announcementText: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroButtonText: string;
  gridTitle: string;
  
  // Theme Customization
  themePrimaryYellow: string;
  themeAccentPink: string;
  themeAccentBlue: string;
  
  visitorCount: number;
  bestsellerIds: number[];

  fetchSettings: () => Promise<void>;
  incrementVisitor: () => Promise<void>;
  toggleBestseller: (productId: number) => Promise<void>;
  updateHeroSettings: (url: string, type: 'image' | 'video') => Promise<void>;
  updateContentSettings: (settings: Partial<Pick<SiteStore, 'announcementText' | 'heroHeadline' | 'heroSubheadline' | 'heroButtonText' | 'gridTitle'>>) => Promise<void>;
  updateThemeSettings: (colors: Partial<Pick<SiteStore, 'themePrimaryYellow' | 'themeAccentPink' | 'themeAccentBlue'>>) => Promise<void>;
}

export const useSiteStore = create<SiteStore>()(
  (set, get) => ({
    heroMediaUrl: '/hero.png', // Default image
    heroMediaType: 'image',
    
    announcementText: '🚀 FREE SHIPPING ON ORDERS OVER ₹1000 • 🎁 GET 2 FREE TESTERS WITH EVERY ORDER',
    heroHeadline: 'UNLEASH YOUR\nAURA ✨',
    heroSubheadline: 'Experience India\'s finest recreated designer fragrances 🌸',
    heroButtonText: 'SHOP THE COLLECTION 🛍️',
    gridTitle: '20 ml Trial Packs – Crazy Bundle Offers 🔥',
    
    themePrimaryYellow: '#FFD166',
    themeAccentPink: '#EF476F',
    themeAccentBlue: '#118AB2',
    
    visitorCount: 0,
    bestsellerIds: [],

    fetchSettings: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data && !error) {
        set({
          heroMediaUrl: data.hero_media_url,
          heroMediaType: data.hero_media_type,
          announcementText: data.announcement_text,
          heroHeadline: data.hero_headline,
          heroSubheadline: data.hero_subheadline,
          heroButtonText: data.hero_button_text,
          gridTitle: data.grid_title,
          themePrimaryYellow: data.theme_primary_yellow,
          themeAccentPink: data.theme_accent_pink,
          themeAccentBlue: data.theme_accent_blue,
          visitorCount: data.visitor_count || 0,
          bestsellerIds: data.bestseller_ids || []
        });
      }
    },

    incrementVisitor: async () => {
      const { error } = await supabase.rpc('increment_visitor');
      if (error) {
        // Fallback to read-modify-write if RPC not deployed yet
        const { data } = await supabase.from('site_settings').select('visitor_count').eq('id', 1).single();
        const newCount = (data?.visitor_count || 0) + 1;
        await supabase.from('site_settings').update({ visitor_count: newCount }).eq('id', 1);
        set({ visitorCount: newCount });
      } else {
        const { data } = await supabase.from('site_settings').select('visitor_count').eq('id', 1).single();
        set({ visitorCount: data?.visitor_count || get().visitorCount });
      }
    },

    toggleBestseller: async (productId) => {
      const current = get().bestsellerIds;
      const updated = current.includes(productId)
        ? current.filter(id => id !== productId)
        : [...current, productId];
      set({ bestsellerIds: updated });
      await supabase.from('site_settings').update({ bestseller_ids: updated }).eq('id', 1);
    },

    updateHeroSettings: async (url, type) => {
      set({ heroMediaUrl: url, heroMediaType: type }); // Optimistic UI update
      await supabase.from('site_settings').update({ hero_media_url: url, hero_media_type: type }).eq('id', 1);
    },
    
    updateContentSettings: async (settings) => {
      set((state) => ({ ...state, ...settings }));
      const updates: any = {};
      if (settings.announcementText) updates.announcement_text = settings.announcementText;
      if (settings.heroHeadline) updates.hero_headline = settings.heroHeadline;
      if (settings.heroSubheadline) updates.hero_subheadline = settings.heroSubheadline;
      if (settings.heroButtonText) updates.hero_button_text = settings.heroButtonText;
      if (settings.gridTitle) updates.grid_title = settings.gridTitle;
      await supabase.from('site_settings').update(updates).eq('id', 1);
    },

    updateThemeSettings: async (colors) => {
      set((state) => ({ ...state, ...colors }));
      const updates: any = {};
      if (colors.themePrimaryYellow) updates.theme_primary_yellow = colors.themePrimaryYellow;
      if (colors.themeAccentPink) updates.theme_accent_pink = colors.themeAccentPink;
      if (colors.themeAccentBlue) updates.theme_accent_blue = colors.themeAccentBlue;
      await supabase.from('site_settings').update(updates).eq('id', 1);
    }
  })
);
