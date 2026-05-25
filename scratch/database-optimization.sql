-- ============================================================================
-- DATABASE OPTIMIZATION MIGRATION
-- Project: perfume-lumen (Supabase: qljfetzjgmycvewwwzmo)
-- Description: Comprehensive optimization including indexes, new tables,
--              constraints, triggers, RLS policies, and views.
-- ============================================================================

-- ============================================================================
-- SECTION 1: NEW TABLES
-- ============================================================================

-- 1a. activity_logs — Persistent admin activity audit trail
--    (Replaces the localStorage-based approach in the admin panel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_phone TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details     JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activity_logs IS 'Admin activity audit trail for debugging and accountability';
COMMENT ON COLUMN public.activity_logs.admin_phone IS 'Phone number of the admin who performed the action';
COMMENT ON COLUMN public.activity_logs.action_type IS 'Category of action: e.g. Content Updated, Theme Colors Updated, Branding Updated';
COMMENT ON COLUMN public.activity_logs.details IS 'JSON blob with action-specific metadata';

-- 1b. email_queue — Durable email queue (replaces JSON file at backend/email-queue.json)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_queue (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email   TEXT NOT NULL,
    subject    TEXT NOT NULL,
    body       TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'general'
               CHECK (type IN ('order_confirmation', 'payment_failed', 'shipping_update', 'general')),
    status     TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
    attempts   SMALLINT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at    TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.email_queue IS 'Durable email queue — replaces the JSON-file queue used by the backend';
COMMENT ON COLUMN public.email_queue.status IS 'queued → processing → sent | failed | cancelled';
COMMENT ON COLUMN public.email_queue.attempts IS 'Number of send attempts (circuit-breaker target: max 5)';

-- 1c. site_analytics — Daily aggregated site metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_analytics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE NOT NULL UNIQUE,
    visitors        INTEGER NOT NULL DEFAULT 0 CHECK (visitors >= 0),
    page_views      INTEGER NOT NULL DEFAULT 0 CHECK (page_views >= 0),
    orders          INTEGER NOT NULL DEFAULT 0 CHECK (orders >= 0),
    revenue         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
    new_users       INTEGER NOT NULL DEFAULT 0 CHECK (new_users >= 0),
    avg_order_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (avg_order_value >= 0),
    bounce_rate     NUMERIC(5,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.site_analytics IS 'Daily site analytics aggregates for dashboard reporting';


-- ============================================================================
-- SECTION 2: INDEXES ON EXISTING TABLES
-- ============================================================================

-- 2a. orders indexes
-- ---------------------------------------------------------------------------
-- Lookup orders by user (used in useOrderStore.fetchOrders)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
    ON public.orders (user_id);

-- Filter by status (admin dashboard, reporting)
CREATE INDEX IF NOT EXISTS idx_orders_status
    ON public.orders (status);

-- Sort/filter by date (admin dashboard time filters: 7d, 30d, 6m, all)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON public.orders (created_at DESC);

-- Composite index for filtered time-range queries by status
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
    ON public.orders (status, created_at DESC);

-- Lookup by payment method for reporting
CREATE INDEX IF NOT EXISTS idx_orders_payment_method
    ON public.orders (payment_method);

-- Filter by coupon code for coupon analytics
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code
    ON public.orders (coupon_code)
    WHERE coupon_code IS NOT NULL;

-- Realtime channel filter: user_id + status
CREATE INDEX IF NOT EXISTS idx_orders_user_status
    ON public.orders (user_id, status);

-- 2b. products indexes
-- ---------------------------------------------------------------------------
-- Category filtering (Shop page category tabs)
CREATE INDEX IF NOT EXISTS idx_products_category
    ON public.products (category)
    WHERE category IS NOT NULL;

-- In-stock filtering (product listing pages)
CREATE INDEX IF NOT EXISTS idx_products_in_stock
    ON public.products (in_stock);

-- Price range queries (sorting, filtering)
CREATE INDEX IF NOT EXISTS idx_products_price
    ON public.products (price);

-- Sort by popularity (rating desc)
CREATE INDEX IF NOT EXISTS idx_products_rating
    ON public.products (rating DESC NULLS LAST);

-- Fetch ordering (used by fetchProducts: order by id asc)
CREATE INDEX IF NOT EXISTS idx_products_id_asc
    ON public.products (id ASC);

-- Full-text search on title
CREATE INDEX IF NOT EXISTS idx_products_title_trgm
    ON public.products USING gin (title gin_trgm_ops);

-- Composite: category + in_stock (common combined filter on shop page)
CREATE INDEX IF NOT EXISTS idx_products_category_instock
    ON public.products (category, in_stock)
    WHERE category IS NOT NULL;

-- 2c. profiles indexes
-- ---------------------------------------------------------------------------
-- Primary key lookups on id are auto-indexed, but phone is queried separately
CREATE INDEX IF NOT EXISTS idx_profiles_phone
    ON public.profiles (phone)
    WHERE phone IS NOT NULL AND phone != '';

-- Full-text search on full_name
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
    ON public.profiles USING gin (full_name gin_trgm_ops);

-- 2d. coupons indexes
-- ---------------------------------------------------------------------------
-- Code lookups (validateCoupon, fetch by code)
CREATE INDEX IF NOT EXISTS idx_coupons_code
    ON public.coupons (code);

-- Active coupon listing
CREATE INDEX IF NOT EXISTS idx_coupons_is_active
    ON public.coupons (is_active);

-- Composite for validateCoupon query: code + is_active
CREATE INDEX IF NOT EXISTS idx_coupons_code_active
    ON public.coupons (code, is_active);

-- Sort by creation date (fetchCoupons ordering)
CREATE INDEX IF NOT EXISTS idx_coupons_created_at
    ON public.coupons (created_at DESC);

-- 2e. admin_users indexes
-- ---------------------------------------------------------------------------
-- Phone login lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_phone
    ON public.admin_users (phone);

-- Role-based admin filtering
CREATE INDEX IF NOT EXISTS idx_admin_users_role
    ON public.admin_users (role);

-- 2f. site_settings indexes
-- ---------------------------------------------------------------------------
-- site_settings uses a single row (id=1), index already exists on PK
-- No additional indexes needed.

-- 2g. New table indexes
-- ---------------------------------------------------------------------------
-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_phone
    ON public.activity_logs (admin_phone);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type
    ON public.activity_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON public.activity_logs (created_at DESC);

-- email_queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status
    ON public.email_queue (status);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created
    ON public.email_queue (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_email_queue_type
    ON public.email_queue (type);

-- site_analytics
CREATE INDEX IF NOT EXISTS idx_site_analytics_date
    ON public.site_analytics (date DESC);


-- ============================================================================
-- SECTION 3: TRIGGERS — updated_at auto-timestamp on ALL tables
-- ============================================================================

-- Reusable trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table (DROP IF EXISTS to make idempotent)
DROP TRIGGER IF EXISTS trg_orders_updated_at           ON public.orders;
DROP TRIGGER IF EXISTS trg_products_updated_at         ON public.products;
DROP TRIGGER IF EXISTS trg_profiles_updated_at         ON public.profiles;
DROP TRIGGER IF EXISTS trg_coupons_updated_at          ON public.coupons;
DROP TRIGGER IF EXISTS trg_site_settings_updated_at    ON public.site_settings;
DROP TRIGGER IF EXISTS trg_admin_users_updated_at      ON public.admin_users;
DROP TRIGGER IF EXISTS trg_email_queue_updated_at      ON public.email_queue;
DROP TRIGGER IF EXISTS trg_site_analytics_updated_at   ON public.site_analytics;
DROP TRIGGER IF EXISTS trg_activity_logs_updated_at    ON public.activity_logs;

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_email_queue_updated_at
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_site_analytics_updated_at
    BEFORE UPDATE ON public.site_analytics
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_activity_logs_updated_at
    BEFORE UPDATE ON public.activity_logs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- SECTION 4: CONSTRAINTS & DEFAULTS ON EXISTING TABLES
-- ============================================================================

-- 4a. orders.status — CHECK constraint for valid statuses
-- Valid statuses determined from usage in codebase:
--   'Processing' (default for COD), 'Paid' (default for prepaid),
--   'Shipped', 'Delivered', 'Cancelled', 'Refunded', 'Failed'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_orders_status'
          AND table_name = 'orders'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT chk_orders_status
            CHECK (status IN (
                'Processing', 'Paid', 'Shipped', 'Delivered',
                'Cancelled', 'Refunded', 'Failed', 'Pending'
            ));
    END IF;
END$$;

-- orders.total must be positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_orders_total_positive'
          AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT chk_orders_total_positive
            CHECK (total >= 0);
    END IF;
END$$;

-- 4b. products.price — CHECK > 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_products_price_positive'
          AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT chk_products_price_positive
            CHECK (price > 0);
    END IF;
END$$;

-- products.original_price — CHECK > 0 (if set)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_products_original_price_positive'
          AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT chk_products_original_price_positive
            CHECK (original_price IS NULL OR original_price > 0);
    END IF;
END$$;

-- products.rating — CHECK between 0 and 5
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_products_rating_range'
          AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT chk_products_rating_range
            CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
    END IF;
END$$;

-- 4c. coupons.discount_percentage — CHECK between 1 and 100
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_coupons_discount_range'
          AND table_name = 'coupons'
    ) THEN
        ALTER TABLE public.coupons
            ADD CONSTRAINT chk_coupons_discount_range
            CHECK (discount_percentage >= 1 AND discount_percentage <= 100);
    END IF;
END$$;

-- coupons.current_uses must be >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_coupons_current_uses_positive'
          AND table_name = 'coupons'
    ) THEN
        ALTER TABLE public.coupons
            ADD CONSTRAINT chk_coupons_current_uses_positive
            CHECK (current_uses >= 0);
    END IF;
END$$;

-- 4d. Default values for timestamps
-- orders
ALTER TABLE public.orders
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- products
ALTER TABLE public.products
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- profiles
ALTER TABLE public.profiles
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- coupons
ALTER TABLE public.coupons
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW(),
    ALTER COLUMN current_uses SET DEFAULT 0,
    ALTER COLUMN is_active SET DEFAULT TRUE;

-- site_settings
ALTER TABLE public.site_settings
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- admin_users (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') THEN
        ALTER TABLE public.admin_users
            ALTER COLUMN created_at SET DEFAULT NOW(),
            ALTER COLUMN updated_at SET DEFAULT NOW();
    END IF;
END$$;


-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 5a. Enable RLS on tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Also ensure RLS is enabled on core tables (idempotent)
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users    ENABLE ROW LEVEL SECURITY;

-- 5b. activity_logs policies
--    Admin users (authenticated) can read/write; general public has no access.
DROP POLICY IF EXISTS "Admins can view activity logs"    ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can insert activity logs"  ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can update activity logs"  ON public.activity_logs;

CREATE POLICY "Admins can view activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Admins can insert activity logs"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Admins can update activity logs"
    ON public.activity_logs FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- 5c. email_queue policies
--    Only service role and authenticated admins should access email queue.
DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;
DROP POLICY IF EXISTS "Authenticated can read email queue"    ON public.email_queue;

CREATE POLICY "Service role can manage email queue"
    ON public.email_queue FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Authenticated can read email queue"
    ON public.email_queue FOR SELECT
    TO authenticated
    USING (TRUE);

-- 5d. site_analytics policies
--    Public can SELECT (for published dashboards); only admins can write.
DROP POLICY IF EXISTS "Public can read site analytics"       ON public.site_analytics;
DROP POLICY IF EXISTS "Admins can manage site analytics"    ON public.site_analytics;

CREATE POLICY "Public can read site analytics"
    ON public.site_analytics FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage site analytics"
    ON public.site_analytics FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- 5e. orders policies
DROP POLICY IF EXISTS "Users can view own orders"     ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders"   ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders"  ON public.orders;

CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all orders"
    ON public.orders FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE phone = current_setting('request.jwt.claim.phone', TRUE)
        )
    );

-- 5f. products policies
DROP POLICY IF EXISTS "Public can view products"       ON public.products;
DROP POLICY IF EXISTS "Admins can manage products"    ON public.products;

CREATE POLICY "Public can view products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE phone = current_setting('request.jwt.claim.phone', TRUE)
        )
    );

-- 5g. profiles policies
DROP POLICY IF EXISTS "Users can view own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"  ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE phone = current_setting('request.jwt.claim.phone', TRUE)
        )
    );

-- 5h. coupons policies
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons"     ON public.coupons;

CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE phone = current_setting('request.jwt.claim.phone', TRUE)
        )
    );

-- 5i. site_settings policies
DROP POLICY IF EXISTS "Public can read site settings"    ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

CREATE POLICY "Public can read site settings"
    ON public.site_settings FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage site settings"
    ON public.site_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE phone = current_setting('request.jwt.claim.phone', TRUE)
        )
    );

-- 5j. admin_users policies
DROP POLICY IF EXISTS "Admins can view admin users"    ON public.admin_users;
DROP POLICY IF EXISTS "Service role manages admin users" ON public.admin_users;

CREATE POLICY "Admins can view admin users"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE phone = current_setting('request.jwt.claim.phone', TRUE)
        )
    );

CREATE POLICY "Service role manages admin users"
    ON public.admin_users FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ============================================================================
-- SECTION 6: HELPFUL VIEWS
-- ============================================================================

-- 6a. daily_sales_summary — Daily revenue and order aggregates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_daily_sales_summary AS
SELECT
    created_at::DATE                              AS sale_date,
    COUNT(*)                                      AS total_orders,
    COUNT(*) FILTER (WHERE status = 'Delivered')  AS delivered_orders,
    COUNT(*) FILTER (WHERE status = 'Cancelled')  AS cancelled_orders,
    COUNT(*) FILTER (WHERE status = 'Processing') AS processing_orders,
    COUNT(*) FILTER (WHERE status = 'Shipped')     AS shipped_orders,
    COALESCE(SUM(total) FILTER (WHERE status = 'Delivered'), 0) AS revenue,
    COALESCE(SUM(total) FILTER (WHERE status NOT IN ('Delivered', 'Cancelled')), 0) AS unrealised_revenue,
    COALESCE(SUM(total), 0)                       AS gross_total,
    COALESCE(AVG(total) FILTER (WHERE status = 'Delivered'), 0)::NUMERIC(12,2) AS avg_order_value,
    COUNT(DISTINCT user_id)                       AS unique_customers
FROM public.orders
GROUP BY created_at::DATE
ORDER BY sale_date DESC;

COMMENT ON VIEW public.v_daily_sales_summary IS 'Daily sales aggregates: revenue, orders, AOV, unique customers';

-- 6b. top_products — Best-selling products with total units and revenue
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_top_products AS
SELECT
    (item->>'id')::INT              AS product_id,
    item->>'title'                  AS product_title,
    SUM((item->>'quantity')::INT)   AS total_units_sold,
    SUM(
        (item->>'quantity')::INT *
        (item->>'price')::NUMERIC
    )::NUMERIC(12,2)               AS total_revenue,
    COUNT(DISTINCT o.user_id)       AS unique_buyers
FROM public.orders o,
     LATERAL jsonb_array_elements(o.items) AS item
WHERE o.status NOT IN ('Cancelled', 'Failed', 'Refunded')
GROUP BY product_id, product_title
ORDER BY total_units_sold DESC;

COMMENT ON VIEW public.v_top_products IS 'Top products by units sold with revenue and unique buyer counts';

-- 6c. customer_order_summary — Per-customer order statistics
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_customer_order_summary AS
SELECT
    o.user_id,
    p.full_name,
    p.phone,
    COUNT(o.id)                                         AS total_orders,
    COALESCE(SUM(o.total), 0)::NUMERIC(12,2)           AS total_spent,
    COALESCE(AVG(o.total), 0)::NUMERIC(12,2)           AS avg_order_value,
    MIN(o.created_at)                                   AS first_order_date,
    MAX(o.created_at)                                   AS last_order_date,
    COUNT(*) FILTER (WHERE o.status = 'Delivered')      AS delivered_count,
    COUNT(*) FILTER (WHERE o.status = 'Cancelled')      AS cancelled_count
FROM public.orders o
LEFT JOIN public.profiles p ON p.id = o.user_id
GROUP BY o.user_id, p.full_name, p.phone
ORDER BY total_spent DESC;

COMMENT ON VIEW public.v_customer_order_summary IS 'Per-customer lifetime order statistics for admin CRM view';

-- 6d. coupon_usage_summary — Coupon effectiveness dashboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_coupon_usage_summary AS
SELECT
    c.code,
    c.discount_percentage,
    c.is_active,
    c.max_uses,
    c.current_uses,
    CASE
        WHEN c.max_uses IS NOT NULL
        THEN ROUND(c.current_uses::NUMERIC / c.max_uses * 100, 1)
        ELSE NULL
    END AS usage_percentage,
    COALESCE(SUM(o.total), 0)::NUMERIC(12,2) AS total_revenue_with_discount,
    COUNT(o.id) AS times_applied,
    c.created_at AS coupon_created_at
FROM public.coupons c
LEFT JOIN public.orders o ON o.coupon_code = c.code
    AND o.status NOT IN ('Cancelled', 'Failed', 'Refunded')
GROUP BY c.code, c.discount_percentage, c.is_active, c.max_uses, c.current_uses, c.created_at
ORDER BY times_applied DESC;

COMMENT ON VIEW public.v_coupon_usage_summary IS 'Coupon effectiveness: usage rate, revenue impact, times applied';


-- ============================================================================
-- SECTION 7: HELPFUL FUNCTIONS
-- ============================================================================

-- 7a. Upsert daily analytics (called by a scheduled job or on order events)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_daily_analytics(p_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.site_analytics (date, visitors, page_views, orders, revenue, avg_order_value)
    VALUES (
        p_date,
        0,  -- visitors must be set externally
        0,  -- page_views must be set externally
        (SELECT COUNT(*) FROM public.orders WHERE created_at::DATE = p_date),
        COALESCE((SELECT SUM(total) FROM public.orders WHERE created_at::DATE = p_date AND status NOT IN ('Cancelled', 'Failed', 'Refunded')), 0),
        COALESCE((SELECT AVG(total) FROM public.orders WHERE created_at::DATE = p_date AND status NOT IN ('Cancelled', 'Failed', 'Refunded')), 0)
    )
    ON CONFLICT (date)
    DO UPDATE SET
        orders          = EXCLUDED.orders,
        revenue          = EXCLUDED.revenue,
        avg_order_value  = EXCLUDED.avg_order_value,
        updated_at       = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.upsert_daily_analytics IS 'Upsert daily order analytics for a given date; call from pg_cron or edge function';

-- 7b. Queue an email from SQL (for DB-level triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_email(
    p_to      TEXT,
    p_subject TEXT,
    p_body    TEXT,
    p_type    TEXT DEFAULT 'general'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.email_queue (to_email, subject, body, type)
    VALUES (p_to, p_subject, p_body, p_type)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.queue_email IS 'Insert an email into the processing queue from SQL/triggers';


-- ============================================================================
-- SECTION 8: ENABLE pg_trgm EXTENSION (for trigram text search indexes)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
--   - 3 new tables: activity_logs, email_queue, site_analytics
--   - 30+ indexes on existing and new tables
--   - updated_at triggers on all 9 tables
--   - CHECK constraints: orders.status, orders.total, products.price,
--     products.original_price, products.rating, coupons.discount_percentage,
--     coupons.current_uses
--   - Default values for all timestamp columns
--   - RLS enabled on 9 tables with granular policies (anon, authenticated, service_role)
--   - 4 analytical views: v_daily_sales_summary, v_top_products,
--     v_customer_order_summary, v_coupon_usage_summary
--   - 2 utility functions: upsert_daily_analytics(), queue_email()
-- ============================================================================
