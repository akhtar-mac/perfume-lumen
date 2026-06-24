import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string; // base64 or object URL for now, Supabase URL later
  name: string;
  caption?: string;
  uploadedAt: string;
}

interface GalleryStore {
  items: GalleryItem[];
  addItem: (item: Omit<GalleryItem, 'id' | 'uploadedAt'>) => void;
  removeItem: (id: string) => void;
  reorderItems: (from: number, to: number) => void;
}

export const useGalleryStore = create<GalleryStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem: GalleryItem = {
          ...item,
          id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          uploadedAt: new Date().toISOString(),
        };
        set(state => ({ items: [...state.items, newItem] }));
      },

      removeItem: (id) => {
        set(state => ({ items: state.items.filter(i => i.id !== id) }));
      },

      reorderItems: (from, to) => {
        const items = [...get().items];
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        set({ items });
      },
    }),
    { name: 'lumen-gallery' }
  )
);
