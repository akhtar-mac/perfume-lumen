import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PRODUCTS } from '../data/products';
import type { Product } from '../data/products';

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  updateProduct: (id: number, updatedProduct: Partial<Product>) => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id'>) => Promise<void>;
  resetProducts: () => Promise<void>;
  submitCustomerRating: (id: number, rating: number) => Promise<void>;
}

export const useProductStore = create<ProductStore>()(
  (set, get) => ({
    products: PRODUCTS,
    isLoading: true,

    fetchProducts: async () => {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (data && !error && data.length > 0) {
        const formattedProducts = data.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          originalPrice: p.original_price,
          images: p.images,
          videoUrl: p.video_url,
          description: p.description,
          notes: p.notes,
          inStock: p.in_stock !== false,
          rating: p.rating ?? null,
          reviewsCount: p.reviews_count ?? 0
        }));
        set({ products: formattedProducts, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    },

    updateProduct: async (id, updatedProduct) => {
      set((state) => ({
        products: state.products.map(product => 
          product.id === id ? { ...product, ...updatedProduct } : product
        )
      }));
      
      const dbUpdate: any = {};
      if (updatedProduct.title !== undefined) dbUpdate.title = updatedProduct.title;
      if (updatedProduct.price !== undefined) dbUpdate.price = updatedProduct.price;
      if (updatedProduct.originalPrice !== undefined) dbUpdate.original_price = updatedProduct.originalPrice;
      if (updatedProduct.images !== undefined) dbUpdate.images = updatedProduct.images;
      if (updatedProduct.videoUrl !== undefined) dbUpdate.video_url = updatedProduct.videoUrl;
      if (updatedProduct.description !== undefined) dbUpdate.description = updatedProduct.description;
      if (updatedProduct.notes !== undefined) dbUpdate.notes = updatedProduct.notes;
      if (updatedProduct.inStock !== undefined) dbUpdate.in_stock = updatedProduct.inStock;
      if (updatedProduct.rating !== undefined) dbUpdate.rating = updatedProduct.rating;
      if (updatedProduct.reviewsCount !== undefined) dbUpdate.reviews_count = updatedProduct.reviewsCount;
      
      await supabase.from('products').update(dbUpdate).eq('id', id);
    },

    addProduct: async (newProduct) => {
      const nextId = get().products.length > 0 
        ? Math.max(...get().products.map(p => p.id)) + 1 
        : 1;
        
      const productWithId = { ...newProduct, id: nextId };
      set((state) => ({ products: [...state.products, productWithId] }));
      
      await supabase.from('products').insert({
        id: productWithId.id,
        title: productWithId.title,
        price: productWithId.price,
        original_price: productWithId.originalPrice,
        images: productWithId.images,
        video_url: productWithId.videoUrl,
        description: productWithId.description,
        notes: productWithId.notes,
        rating: productWithId.rating || 5,
        reviews_count: productWithId.reviewsCount || 0
      });
    },

    resetProducts: async () => {
      set({ products: PRODUCTS });
      const inserts = PRODUCTS.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        original_price: p.originalPrice,
        images: p.images,
        video_url: p.videoUrl,
        description: p.description,
        notes: p.notes,
        rating: p.rating,
        reviews_count: p.reviewsCount
      }));

      // Try transactional RPC first; fallback to delete+insert if not deployed
      const { error: rpcError } = await supabase.rpc('reset_products', {
        new_products: JSON.stringify(inserts)
      });

      if (rpcError) {
        await supabase.from('products').delete().neq('id', 0);
        await supabase.from('products').insert(inserts);
      }
    },

    submitCustomerRating: async (id, newRating) => {
      const state = get();
      const product = state.products.find(p => p.id === id);
      if (!product) return;

      const currentRating = product.rating ?? 0;
      const currentCount = product.reviewsCount ?? 0;
      
      const updatedRating = Number((((currentRating * currentCount) + newRating) / (currentCount + 1)).toFixed(1));
      const updatedCount = currentCount + 1;

      // Optimistic UI update
      set({
        products: state.products.map(p => 
          p.id === id ? { ...p, rating: updatedRating, reviewsCount: updatedCount } : p
        )
      });

      // DB update
      await supabase.from('products').update({
        rating: updatedRating,
        reviews_count: updatedCount
      }).eq('id', id);
    }
  })
);
