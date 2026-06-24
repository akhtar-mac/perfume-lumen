// Generated Supabase types (stub — regenerate with:
//   supabase gen types typescript --project-id qljfetzjgmycvewwwzmo > packages/shared/src/types/db.ts

export interface Database {
  public: {
    Tables: {
      products: { Row: Product; Insert: ProductInsert; Update: ProductUpdate }
      orders: { Row: Order; Insert: OrderInsert; Update: OrderUpdate }
      admin_users: { Row: AdminUser; Insert: AdminUserInsert; Update: AdminUserUpdate }
      coupons: { Row: Coupon; Insert: CouponInsert; Update: CouponUpdate }
      contact_messages: { Row: ContactMessage; Insert: ContactMessageInsert }
      site_settings: { Row: SiteSettings; Update: SiteSettingsUpdate }
    }
  }
}

export interface Product {
  id: number
  title: string
  price: number
  original_price: number | null
  images: string[]
  video_url: string | null
  description: string | null
  notes: Record<string, string[]> | null
  in_stock: boolean | null
  rating: number | null
  reviews_count: number
}

export type ProductInsert = Omit<Product, 'id'>
export type ProductUpdate = Partial<ProductInsert>

export interface Order {
  id: string
  user_id: string | null
  total: number
  items: OrderItem[]
  status: string
  payment_method: string
  shipping_fee: number
  coupon_code: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  payment_status: string
  shipping_address: ShippingAddress | null
  created_at: string
}

export type OrderInsert = Omit<Order, 'id' | 'created_at'>
export type OrderUpdate = Partial<OrderInsert>

export interface OrderItem {
  id: number | string
  title: string
  price: number
  quantity: number
  image?: string
}

export interface ShippingAddress {
  name: string
  phone: string
  address: string
  city: string
  pincode: string
}

export interface AdminUser {
  id: string
  phone: string
  password: string | null
  password_hash: string | null
  role: string
  permissions: string[] | null
  created_at: string
}

export type AdminUserInsert = Omit<AdminUser, 'id' | 'created_at'>
export type AdminUserUpdate = Partial<Omit<AdminUser, 'id' | 'created_at'>>

export interface Coupon {
  id: string
  code: string
  discount_percentage: number
  max_uses: number | null
  current_uses: number
  is_active: boolean
  created_at: string
}

export type CouponInsert = Omit<Coupon, 'id' | 'created_at'>
export type CouponUpdate = Partial<CouponInsert>

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  read: boolean
  created_at: string
}

export type ContactMessageInsert = Omit<ContactMessage, 'id' | 'created_at' | 'read'>

export interface SiteSettings {
  id: number
  visitor_count: number
  announcement_text: string | null
  hero_media_url: string
  hero_media_type: string
  hero_headline: string
  hero_subheadline: string
  hero_button_text: string
  grid_title: string
  theme_primary_yellow: string
  theme_accent_pink: string
  theme_accent_blue: string
  bestseller_ids: number[]
}

export type SiteSettingsUpdate = Partial<Omit<SiteSettings, 'id'>>