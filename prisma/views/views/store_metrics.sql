SELECT
  s.id AS store_id,
  s.name AS store_name,
  s.slug AS store_slug,
  count(DISTINCT o.id) AS total_orders,
  count(DISTINCT o.id) FILTER (
    WHERE
      (
        o.created_at >= (CURRENT_DATE - '30 days' :: INTERVAL)
      )
  ) AS orders_last_30_days,
  count(DISTINCT o.id) FILTER (
    WHERE
      (o.status = 'delivered' :: order_status_enum)
  ) AS delivered_orders,
  count(DISTINCT o.customer_id) AS unique_customers,
  COALESCE(avg(o.total_amount), (0) :: numeric) AS average_order_value,
  COALESCE(sum(o.total_amount), (0) :: numeric) AS total_revenue,
  COALESCE(
    sum(o.total_amount) FILTER (
      WHERE
        (
          o.created_at >= (CURRENT_DATE - '30 days' :: INTERVAL)
        )
    ),
    (0) :: numeric
  ) AS revenue_last_30_days,
  count(DISTINCT p.id) AS active_products,
  s.rating,
  s.review_count
FROM
  (
    (
      public.stores s
      LEFT JOIN orders o ON (
        (
          (o.store_id = s.id)
          AND (o.deleted_at IS NULL)
        )
      )
    )
    LEFT JOIN public.products p ON (
      (
        (p.store_id = s.id)
        AND (p.deleted_at IS NULL)
        AND (p.is_active = TRUE)
      )
    )
  )
WHERE
  (
    (s.deleted_at IS NULL)
    AND (s.is_active = TRUE)
  )
GROUP BY
  s.id;