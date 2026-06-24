-- Migration: Row Level Security policies for all tables
-- CRITICAL: Without RLS, the anon key in the browser gives anyone full read/write.
-- Apply this in Supabase SQL editor before going live.

-- ============================================================
-- PRODUCTS
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products (storefront)
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  USING (in_stock = true OR in_stock IS NULL);

-- No client-side writes (backend service role bypasses RLS)
-- Admin writes go through backend with service role key

-- ============================================================
-- ORDERS
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own orders only
CREATE POLICY "user_read_own_orders"
  ON orders FOR SELECT
  USING (auth.uid()::text = user_id);

-- No client-side inserts (backend service role only)
-- No client-side updates

-- ============================================================
-- PROFILES (user data)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "user_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "user_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- ============================================================
-- ADMIN_USERS — MOST SENSITIVE TABLE
-- ============================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- NO anon/authenticated access to admin_users from the browser.
-- Admin login must go through a backend endpoint that uses the service role key.
-- The service role bypasses RLS automatically.
CREATE POLICY "no_public_access_admin_users"
  ON admin_users FOR ALL
  USING (false);

-- ============================================================
-- COUPONS
-- ============================================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active coupons (to validate at checkout)
CREATE POLICY "auth_read_active_coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

-- No client-side writes (admin writes via service role)

-- ============================================================
-- SITE_SETTINGS
-- ============================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for banner/announcement/theme display)
CREATE POLICY "public_read_settings"
  ON site_settings FOR SELECT
  USING (true);

-- No client writes (service role only via backend)

-- ============================================================
-- CONTACT_MESSAGES
-- ============================================================
-- (Already has RLS from migration 003, included here for completeness)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_contact"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "no_public_read_contact"
  ON contact_messages FOR SELECT
  USING (false);

-- ============================================================
-- IMPORTANT NOTES
-- ============================================================
-- After applying this migration:
-- 1. The admin dashboard's direct Supabase queries from the browser (using anon key)
--    will FAIL for protected tables (admin_users, orders, coupons, site_settings).
-- 2. You must either:
--    a) Move admin queries to backend endpoints (with service role), OR
--    b) Use Supabase Auth for admin accounts with proper RLS policies.
-- 3. The frontend storefront will continue to work for:
--    - Reading active products (public)
--    - Reading own orders (authenticated, filtered by user_id)
--    - Reading site settings (public)
--    - Reading active coupons (authenticated)
--    - Inserting contact messages (anon)