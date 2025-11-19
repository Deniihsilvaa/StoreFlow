SELECT
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.product_name,
  oi.product_family,
  oi.quantity,
  oi.unit_price,
  oi.unit_cost_price,
  oi.total_price,
  oi.observations,
  oi.deleted_at,
  oi.created_at,
  o.store_id,
  o.status AS order_status,
  p.family AS product_family_original,
  p.image_url AS product_image_url,
  json_agg(
    DISTINCT jsonb_build_object(
      'customization_name',
      oic.customization_name,
      'customization_type',
      oic.customization_type,
      'quantity',
      oic.quantity,
      'unit_price',
      oic.unit_price,
      'total_price',
      oic.total_price
    )
  ) FILTER (
    WHERE
      (oic.id IS NOT NULL)
  ) AS customizations
FROM
  (
    (
      (
        orders.order_items oi
        JOIN orders.orders o ON (
          (
            (o.id = oi.order_id)
            AND (o.deleted_at IS NULL)
          )
        )
      )
      LEFT JOIN public.products p ON ((p.id = oi.product_id))
    )
    LEFT JOIN orders.order_item_customizations oic ON (
      (
        (oic.order_item_id = oi.id)
        AND (oic.deleted_at IS NULL)
      )
    )
  )
WHERE
  (oi.deleted_at IS NULL)
GROUP BY
  oi.id,
  o.id,
  p.id;