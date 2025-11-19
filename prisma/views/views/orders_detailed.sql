SELECT
  o.id,
  o.store_id,
  o.customer_id,
  o.delivery_option_id,
  o.fulfillment_method,
  o.pickup_slot,
  o.total_amount,
  o.delivery_fee,
  o.status,
  o.payment_method,
  o.payment_status,
  o.estimated_delivery_time,
  o.observations,
  o.cancellation_reason,
  o.deleted_at,
  o.created_at,
  o.updated_at,
  s.name AS store_name,
  s.slug AS store_slug,
  c.name AS customer_name,
  c.phone AS customer_phone,
  oda.street AS delivery_street,
  oda.number AS delivery_number,
  oda.neighborhood AS delivery_neighborhood,
  oda.city AS delivery_city,
  oda.state AS delivery_state,
  oda.zip_code AS delivery_zip_code,
  sdo.name AS delivery_option_name,
  sdo.fee AS delivery_option_fee,
  count(oi.id) AS items_count,
  sum(oi.quantity) AS total_items,
  json_agg(
    DISTINCT jsonb_build_object(
      'status',
      osh.status,
      'changed_at',
      osh.created_at,
      'note',
      osh.note
    )
  ) AS status_history
FROM
  (
    (
      (
        (
          (
            (
              orders.orders o
              JOIN public.stores s ON (
                (
                  (s.id = o.store_id)
                  AND (s.deleted_at IS NULL)
                )
              )
            )
            JOIN public.customers c ON (
              (
                (c.id = o.customer_id)
                AND (c.deleted_at IS NULL)
              )
            )
          )
          LEFT JOIN orders.order_delivery_addresses oda ON (
            (
              (oda.order_id = o.id)
              AND (oda.deleted_at IS NULL)
            )
          )
        )
        LEFT JOIN public.store_delivery_options sdo ON (
          (
            (sdo.id = o.delivery_option_id)
            AND (sdo.deleted_at IS NULL)
          )
        )
      )
      LEFT JOIN orders.order_items oi ON (
        (
          (oi.order_id = o.id)
          AND (oi.deleted_at IS NULL)
        )
      )
    )
    LEFT JOIN orders.order_status_history osh ON (
      (
        (osh.order_id = o.id)
        AND (osh.deleted_at IS NULL)
      )
    )
  )
WHERE
  (o.deleted_at IS NULL)
GROUP BY
  o.id,
  s.id,
  c.id,
  oda.id,
  sdo.id;