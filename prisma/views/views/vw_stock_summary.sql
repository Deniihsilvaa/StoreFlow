SELECT
  s.name AS store_name,
  p.name AS product_name,
  p.family AS product_family,
  i.current_stock,
  i.min_stock,
  CASE
    WHEN (i.current_stock = 0) THEN '🔴 SEM ESTOQUE' :: text
    WHEN (i.current_stock <= i.min_stock) THEN '🟡 ESTOQUE BAIXO' :: text
    ELSE '🟢 NORMAL' :: text
  END AS STATUS,
  i.updated_at
FROM
  (
    (
      inventory.inventory i
      JOIN public.products p ON ((p.id = i.product_id))
    )
    JOIN public.stores s ON ((s.id = i.store_id))
  )
ORDER BY
  s.name,
  p.name;