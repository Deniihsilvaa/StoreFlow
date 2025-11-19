SELECT
  s.id,
  s.merchant_id,
  s.name,
  s.slug,
  s.description,
  s.category,
  s.custom_category,
  s.avatar_url,
  s.banner_url,
  s.rating,
  s.review_count,
  s.primary_color,
  s.secondary_color,
  s.accent_color,
  s.text_color,
  s.is_active,
  s.delivery_time,
  s.min_order_value,
  s.delivery_fee,
  s.free_delivery_above,
  s.accepts_payment_credit_card,
  s.accepts_payment_debit_card,
  s.accepts_payment_pix,
  s.accepts_payment_cash,
  s.fulfillment_delivery_enabled,
  s.fulfillment_pickup_enabled,
  s.fulfillment_pickup_instructions,
  s.deleted_at,
  s.created_at,
  s.updated_at,
  s.legal_responsible_name,
  s.legal_responsible_document,
  s.terms_accepted_at,
  sa.street AS address_street,
  sa.number AS address_number,
  sa.neighborhood AS address_neighborhood,
  sa.city AS address_city,
  sa.state AS address_state,
  sa.zip_code AS address_zip_code,
  sa.complement AS address_complement,
  count(DISTINCT p.id) AS products_count,
  count(DISTINCT smm.merchant_id) AS team_members_count,
  json_agg(
    DISTINCT jsonb_build_object(
      'week_day',
      swh.week_day,
      'opens_at',
      swh.opens_at,
      'closes_at',
      swh.closes_at,
      'is_closed',
      swh.is_closed
    )
  ) AS working_hours
FROM
  (
    (
      (
        (
          public.stores s
          LEFT JOIN public.store_addresses sa ON (
            (
              (sa.store_id = s.id)
              AND (
                sa.address_type = 'main' :: public.store_address_type_enum
              )
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
      LEFT JOIN public.store_merchant_members smm ON (
        (
          (smm.store_id = s.id)
          AND (smm.deleted_at IS NULL)
        )
      )
    )
    LEFT JOIN public.store_working_hours swh ON (
      (
        (swh.store_id = s.id)
        AND (swh.deleted_at IS NULL)
      )
    )
  )
WHERE
  (
    (s.deleted_at IS NULL)
    AND (s.is_active = TRUE)
  )
GROUP BY
  s.id,
  sa.id;