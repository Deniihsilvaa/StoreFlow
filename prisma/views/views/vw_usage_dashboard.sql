SELECT
  s.id AS store_id,
  s.name AS store_name,
  sub.status AS subscription_status,
  sub.trial_end,
  p.name AS plan_name,
  p.display_name AS plan_display_name,
  p.max_products,
  p.max_orders_monthly,
  p.max_storage_mb,
  COALESCE(u.products_count, 0) AS current_products,
  COALESCE(u.orders_count, 0) AS current_orders_monthly,
  CASE
    WHEN (
      (sub.status = 'trialing' :: text)
      AND (sub.trial_end < NOW())
    ) THEN 'trial_expired' :: text
    WHEN (sub.status = 'trialing' :: text) THEN 'in_trial' :: text
    ELSE sub.status
  END AS billing_status,
  round(
    (
      (
        (COALESCE(u.products_count, 0)) :: numeric / (NULLIF(p.max_products, 0)) :: numeric
      ) * (100) :: numeric
    ),
    1
  ) AS products_usage_percent,
  round(
    (
      (
        (COALESCE(u.orders_count, 0)) :: numeric / (NULLIF(p.max_orders_monthly, 0)) :: numeric
      ) * (100) :: numeric
    ),
    1
  ) AS orders_usage_percent,
  CASE
    WHEN (sub.status = 'trialing' :: text) THEN GREATEST(
      (0) :: numeric,
      EXTRACT(
        days
        FROM
          (sub.trial_end - NOW())
      )
    )
    ELSE NULL :: numeric
  END AS trial_days_remaining
FROM
  (
    (
      (
        public.stores s
        JOIN billing.subscriptions sub ON ((sub.store_id = s.id))
      )
      JOIN billing.plans p ON ((p.id = sub.plan_id))
    )
    LEFT JOIN billing.usage_metrics u ON (
      (
        (u.store_id = s.id)
        AND (u.month = date_trunc('month' :: text, NOW()))
      )
    )
  )
WHERE
  (s.deleted_at IS NULL);