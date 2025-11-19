SELECT
  c.id,
  c.auth_user_id,
  c.phone,
  c.name,
  c.deleted_at,
  c.created_at,
  c.updated_at,
  count(DISTINCT o.id) AS total_orders,
  count(DISTINCT o.id) FILTER (
    WHERE
      (o.status = 'delivered' :: orders.order_status_enum)
  ) AS delivered_orders,
  count(DISTINCT o.id) FILTER (
    WHERE
      (
        o.created_at >= (CURRENT_DATE - '30 days' :: INTERVAL)
      )
  ) AS recent_orders,
  COALESCE(sum(o.total_amount), (0) :: numeric) AS total_spent,
  COALESCE(max(o.created_at), c.created_at) AS last_order_date,
  count(DISTINCT ca.id) AS saved_addresses,
  json_agg(
    DISTINCT jsonb_build_object(
      'store_name',
      s.name,
      'order_date',
      o.created_at,
      'total_amount',
      o.total_amount,
      'status',
      o.status
    )
  ) FILTER (
    WHERE
      (o.id IS NOT NULL)
  ) AS recent_orders_details
FROM
  (
    (
      (
        public.customers c
        LEFT JOIN orders.orders o ON (
          (
            (o.customer_id = c.id)
            AND (o.deleted_at IS NULL)
          )
        )
      )
      LEFT JOIN public.stores s ON ((s.id = o.store_id))
    )
    LEFT JOIN public.customer_addresses ca ON (
      (
        (ca.customer_id = c.id)
        AND (ca.deleted_at IS NULL)
      )
    )
  )
WHERE
  (c.deleted_at IS NULL)
GROUP BY
  c.id;