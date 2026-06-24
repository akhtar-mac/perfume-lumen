-- Migration: Atomic increment RPCs
-- Replaces client-side read-modify-write race conditions.

-- Atomic visitor count increment
CREATE OR REPLACE FUNCTION increment_visitor()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE site_settings
  SET visitor_count = visitor_count + 1
  WHERE id = 1;
END;
$$;

-- Atomic coupon use increment with max-use guard
-- Returns true if the coupon was successfully used, false if limit reached.
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uses int;
  v_max  int;
BEGIN
  SELECT uses_count, max_uses INTO v_uses, v_max
  FROM coupons WHERE code = coupon_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_uses >= v_max THEN
    RETURN false;
  END IF;

  UPDATE coupons
  SET uses_count = uses_count + 1
  WHERE code = coupon_code;

  RETURN true;
END;
$$;