import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ActivityLog {
  id: string;
  timestamp: string;
  adminPhone: string;
  actionType: string;
  details: string;
}

interface SiteStore {
  heroMediaUrl: string;
  heroMediaType: 'image' | 'video';
  
  // Content Customization
  announcementText: string;
  announcementEnabled: boolean;
  heroHeadline: string;
  heroSubheadline: string;
  heroButtonText: string;
  gridTitle: string;
  
  // Theme Customization — Colors
  themePrimaryYellow: string;
  themeAccentPink: string;
  themeAccentBlue: string;
  themeBgPrimary: string;
  themeBgSecondary: string;
  themeTextPrimary: string;
  themeTextSecondary: string;
  themeBorder: string;
  themeSuccess: string;
  themeWarning: string;
  themeError: string;

  // Theme Customization — Typography & Layout
  themeFontFamily: string;
  themeBorderRadius: string;
  themeButtonStyle: 'rounded' | 'square' | 'sharp';
  themeCustomCSS: string;

  // Branding
  siteTitle: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  
  visitorCount: number;
  bestsellerIds: number[];

  fetchSettings: () => Promise<void>;
  incrementVisitor: () => Promise<void>;
  toggleBestseller: (productId: number) => Promise<void>;
  updateHeroSettings: (url: string, type: 'image' | 'video') => Promise<void>;
  updateContentSettings: (settings: Partial<Pick<SiteStore, 'announcementText' | 'announcementEnabled' | 'heroHeadline' | 'heroSubheadline' | 'heroButtonText' | 'gridTitle'>>) => Promise<void>;
  updateThemeSettings: (colors: Partial<Pick<SiteStore, 'themePrimaryYellow' | 'themeAccentPink' | 'themeAccentBlue' | 'themeBgPrimary' | 'themeBgSecondary' | 'themeTextPrimary' | 'themeTextSecondary' | 'themeBorder' | 'themeSuccess' | 'themeWarning' | 'themeError'>>) => Promise<void>;
  updateThemeAppearance: (appearance: Partial<Pick<SiteStore, 'themeFontFamily' | 'themeBorderRadius' | 'themeButtonStyle' | 'themeCustomCSS'>>) => Promise<void>;
  updateBranding: (branding: Partial<Pick<SiteStore, 'siteTitle' | 'siteDescription' | 'logoUrl' | 'faviconUrl' | 'footerText' | 'socialFacebook' | 'socialInstagram' | 'socialTwitter' | 'socialYoutube'>>) => Promise<void>;

  // Activity Logs
  activityLogs: ActivityLog[];
  fetchActivityLogs: () => void;
  addActivityLog: (actionType: string, details: string) => void;
  clearActivityLogs: () => void;
}

export const useSiteStore = create<SiteStore>()(
  (set, get) => ({
    heroMediaUrl: '/hero.png', // Default image
    heroMediaType: 'image',
    
    announcementText: '🚀 FREE SHIPPING ON ORDERS OVER ₹1000 • 🎁 GET 2 FREE TESTERS WITH EVERY ORDER',
    announcementEnabled: true,
    heroHeadline: 'UNLEASH YOUR\nAURA ✨',
    heroSubheadline: 'Experience India\'s finest recreated designer fragrances 🌸',
    heroButtonText: 'SHOP THE COLLECTION 🛍️',
    gridTitle: '20 ml Trial Packs – Crazy Bundle Offers 🔥',
    
    themePrimaryYellow: '#FFD166',
    themeAccentPink: '#EF476F',
    themeAccentBlue: '#118AB2',
    themeBgPrimary: '#FFFFFF',
    themeBgSecondary: '#F8F9FA',
    themeTextPrimary: '#1A1A2E',
    themeTextSecondary: '#666666',
    themeBorder: '#E0E0E0',
    themeSuccess: '#10B981',
    themeWarning: '#F59E0B',
    themeError: '#EF4444',

    themeFontFamily: "'Inter', sans-serif",
    themeBorderRadius: '8',
    themeButtonStyle: 'rounded',
    themeCustomCSS: '',

    siteTitle: 'LUMEN – Designer Recreated Perfumes',
    siteDescription: 'India\'s finest recreated designer fragrances at unbeatable prices.',
    logoUrl: '',
    faviconUrl: '',
    footerText: '© 2025 LUMEN. All rights reserved.',
    socialFacebook: '',
    socialInstagram: '',
    socialTwitter: '',
    socialYoutube: '',
    
    visitorCount: 0,
    bestsellerIds: [],

    // Activity logs
    activityLogs: [],
    fetchActivityLogs: () => {
      try {
        const stored = localStorage.getItem('activity_logs');
        if (stored) {
          set({ activityLogs: JSON.parse(stored) });
        }
      } catch {
        // ignore parse errors
      }
    },
    addActivityLog: (actionType, details) => {
      const myPhone = localStorage.getItem('adminPhone') || 'unknown';
      const newLog: ActivityLog = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toISOString(),
        adminPhone: myPhone,
        actionType,
        details,
      };
      const updated = [newLog, ...get().activityLogs];
      // Keep max 500 logs in localStorage
      const trimmed = updated.slice(0, 500);
      localStorage.setItem('activity_logs', JSON.stringify(trimmed));
      set({ activityLogs: trimmed });
    },
    clearActivityLogs: () => {
      localStorage.removeItem('activity_logs');
      set({ activityLogs: [] });
    },

    fetchSettings: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data && !error) {
        set({
          heroMediaUrl: data.hero_media_url,
          heroMediaType: data.hero_media_type,
          announcementText: data.announcement_text,
          announcementEnabled: data.announcement_enabled ?? true,
          heroHeadline: data.hero_headline,
          heroSubheadline: data.hero_subheadline,
          heroButtonText: data.hero_button_text,
          gridTitle: data.grid_title,
          themePrimaryYellow: data.theme_primary_yellow,
          themeAccentPink: data.theme_accent_pink,
          themeAccentBlue: data.theme_accent_blue,
          themeBgPrimary: data.theme_bg_primary || '#FFFFFF',
          themeBgSecondary: data.theme_bg_secondary || '#F8F9FA',
          themeTextPrimary: data.theme_text_primary || '#1A1A2E',
          themeTextSecondary: data.theme_text_secondary || '#666666',
          themeBorder: data.theme_border || '#E0E0E0',
          themeSuccess: data.theme_success || '#10B981',
          themeWarning: data.theme_warning || '#F59E0B',
          themeError: data.theme_error || '#EF4444',
          themeFontFamily: data.theme_font_family || "'Inter', sans-serif",
          themeBorderRadius: data.theme_border_radius || '8',
          themeButtonStyle: data.theme_button_style || 'rounded',
          themeCustomCSS: data.theme_custom_css || '',
          siteTitle: data.site_title || 'LUMEN – Designer Recreated Perfumes',
          siteDescription: data.site_description || '',
          logoUrl: data.logo_url || '',
          faviconUrl: data.favicon_url || '',
          footerText: data.footer_text || '',
          socialFacebook: data.social_facebook || '',
          socialInstagram: data.social_instagram || '',
          socialTwitter: data.social_twitter || '',
          socialYoutube: data.social_youtube || '',
          visitorCount: data.visitor_count || 0,
          bestsellerIds: data.bestseller_ids || []
        });
      }
    },

    incrementVisitor: async () => {
      // We fetch current count directly from DB to prevent race conditions if possible,
      // or rely on a simple update. Supabase RPC is better, but a local read+write is fine for demo.
      const { data } = await supabase.from('site_settings').select('visitor_count').eq('id', 1).single();
      const newCount = (data?.visitor_count || 0) + 1;
      
      await supabase.from('site_settings').update({ visitor_count: newCount }).eq('id', 1);
      set({ visitorCount: newCount });
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
      if (settings.announcementText !== undefined) updates.announcement_text = settings.announcementText;
      if (settings.announcementEnabled !== undefined) updates.announcement_enabled = settings.announcementEnabled;
      if (settings.heroHeadline !== undefined) updates.hero_headline = settings.heroHeadline;
      if (settings.heroSubheadline !== undefined) updates.hero_subheadline = settings.heroSubheadline;
      if (settings.heroButtonText !== undefined) updates.hero_button_text = settings.heroButtonText;
      if (settings.gridTitle !== undefined) updates.grid_title = settings.gridTitle;
      await supabase.from('site_settings').update(updates).eq('id', 1);
    },

    updateThemeSettings: async (colors) => {
      set((state) => ({ ...state, ...colors }));
      const updates: any = {};
      if (colors.themePrimaryYellow !== undefined) updates.theme_primary_yellow = colors.themePrimaryYellow;
      if (colors.themeAccentPink !== undefined) updates.theme_accent_pink = colors.themeAccentPink;
      if (colors.themeAccentBlue !== undefined) updates.theme_accent_blue = colors.themeAccentBlue;
      if (colors.themeBgPrimary !== undefined) updates.theme_bg_primary = colors.themeBgPrimary;
      if (colors.themeBgSecondary !== undefined) updates.theme_bg_secondary = colors.themeBgSecondary;
      if (colors.themeTextPrimary !== undefined) updates.theme_text_primary = colors.themeTextPrimary;
      if (colors.themeTextSecondary !== undefined) updates.theme_text_secondary = colors.themeTextSecondary;
      if (colors.themeBorder !== undefined) updates.theme_border = colors.themeBorder;
      if (colors.themeSuccess !== undefined) updates.theme_success = colors.themeSuccess;
      if (colors.themeWarning !== undefined) updates.theme_warning = colors.themeWarning;
      if (colors.themeError !== undefined) updates.theme_error = colors.themeError;
      await supabase.from('site_settings').update(updates).eq('id', 1);
    },

    updateThemeAppearance: async (appearance) => {
      set((state) => ({ ...state, ...appearance }));
      const updates: any = {};
      if (appearance.themeFontFamily !== undefined) updates.theme_font_family = appearance.themeFontFamily;
      if (appearance.themeBorderRadius !== undefined) updates.theme_border_radius = appearance.themeBorderRadius;
      if (appearance.themeButtonStyle !== undefined) updates.theme_button_style = appearance.themeButtonStyle;
      if (appearance.themeCustomCSS !== undefined) updates.theme_custom_css = appearance.themeCustomCSS;
      await supabase.from('site_settings').update(updates).eq('id', 1);
    },

    updateBranding: async (branding) => {
      set((state) => ({ ...state, ...branding }));
      const updates: any = {};
      if (branding.siteTitle !== undefined) updates.site_title = branding.siteTitle;
      if (branding.siteDescription !== undefined) updates.site_description = branding.siteDescription;
      if (branding.logoUrl !== undefined) updates.logo_url = branding.logoUrl;
      if (branding.faviconUrl !== undefined) updates.favicon_url = branding.faviconUrl;
      if (branding.footerText !== undefined) updates.footer_text = branding.footerText;
      if (branding.socialFacebook !== undefined) updates.social_facebook = branding.socialFacebook;
      if (branding.socialInstagram !== undefined) updates.social_instagram = branding.socialInstagram;
      if (branding.socialTwitter !== undefined) updates.social_twitter = branding.socialTwitter;
      if (branding.socialYoutube !== undefined) updates.social_youtube = branding.socialYoutube;
      await supabase.from('site_settings').update(updates).eq('id', 1);
    }
  })
);
