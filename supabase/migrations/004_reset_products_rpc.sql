-- Migration: Transactional product reset RPC
-- Replaces the client-side delete-all-then-insert hack with an atomic operation.
CREATE OR REPLACE FUNCTION reset_products(new_products jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM products;
  INSERT INTO products
  SELECT
    (value->>'id')::int AS id,
    value->>'title' AS title,
    (value->>'price')::numeric AS price,
    NULLIF(value->>'original_price', '')::numeric AS original_price,
    value->'images' AS images,
    NULLIF(value->>'video_url', '') AS video_url,
    value->>'description' AS description,
    value->'notes' AS notes,
    COALESCE((value->>'in_stock')::boolean, true) AS in_stock,
    NULLIF(value->>'rating', '')::numeric AS rating,
    COALESCE((value->>'reviews_count')::int, 0) AS reviews_count
  FROM jsonb_array_elements(new_products) AS t(value);
END;
$$;