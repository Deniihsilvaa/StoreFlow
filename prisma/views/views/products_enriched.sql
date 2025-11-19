SELECT
  p.id,
  p.store_id,
  p.name,
  p.description,
  p.price,
  p.cost_price,
  p.family,
  p.image_url,
  p.category,
  p.custom_category,
  p.is_active,
  p.preparation_time,
  p.nutritional_info,
  p.deleted_at,
  p.created_at,
  p.updated_at,
  s.name AS store_name,
  s.slug AS store_slug,
  s.category AS store_category,
  count(DISTINCT pc.id) AS customizations_count,
  count(DISTINCT pela.id) AS extra_lists_count,
  json_agg(
    DISTINCT jsonb_build_object(
      'id',
      pc.id,
      'name',
      pc.name,
      'customization_type',
      pc.customization_type,
      'price',
      pc.price,
      'selection_type',
      pc.selection_type
    )
  ) FILTER (
    WHERE
      (pc.id IS NOT NULL)
  ) AS available_customizations
FROM
  (
    (
      (
        public.products p
        JOIN public.stores s ON (
          (
            (s.id = p.store_id)
            AND (s.deleted_at IS NULL)
          )
        )
      )
      LEFT JOIN public.product_customizations pc ON (
        (
          (pc.product_id = p.id)
          AND (pc.deleted_at IS NULL)
        )
      )
    )
    LEFT JOIN public.product_extra_list_applicability pela ON ((pela.product_id = p.id))
  )
WHERE
  (
    (p.deleted_at IS NULL)
    AND (p.is_active = TRUE)
  )
GROUP BY
  p.id,
  s.id;