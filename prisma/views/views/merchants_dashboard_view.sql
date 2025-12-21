SELECT
  m.id,
  m.email,
  m.role,
  m.type,
  COALESCE(
    (u.raw_user_meta_data ->> 'name' :: text),
    (u.raw_user_meta_data ->> 'business_name' :: text),
    split_part(m.email, '@' :: text, 1)
  ) AS display_name,
  (u.raw_user_meta_data ->> 'avatar_url' :: text) AS avatar_url,
  (u.raw_user_meta_data ->> 'category' :: text) AS category,
  to_char(m.created_at, 'DD/MM/YYYY' :: text) AS created_date,
  to_char(u.last_sign_in_at, 'DD/MM/YYYY HH24:MI' :: text) AS last_login,
  CASE
    WHEN (u.email_confirmed_at IS NOT NULL) THEN '✅ Verificado' :: text
    ELSE '⏳ Pendente' :: text
  END AS verification_status,
  CASE
    WHEN (u.last_sign_in_at IS NULL) THEN 'Nunca acessou' :: text
    WHEN (u.last_sign_in_at > (NOW() - '7 days' :: INTERVAL)) THEN 'Ativo (últimos 7 dias)' :: text
    WHEN (
      u.last_sign_in_at > (NOW() - '30 days' :: INTERVAL)
    ) THEN 'Ativo (último mês)' :: text
    ELSE 'Inativo' :: text
  END AS activity_status,
  u.phone,
  (u.raw_user_meta_data ->> 'website' :: text) AS website
FROM
  (
    public.merchants m
    LEFT JOIN auth.users u ON ((m.auth_user_id = u.id))
  )
WHERE
  (m.deleted_at IS NULL)
ORDER BY
  m.created_at DESC;