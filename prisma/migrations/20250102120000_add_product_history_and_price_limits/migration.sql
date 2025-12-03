-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."product_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "changed_by" UUID,
    "change_type" TEXT NOT NULL,
    "previous_data" JSONB,
    "new_data" JSONB NOT NULL,
    "changed_fields" TEXT[] NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."product_category_price_limits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "min_price" DECIMAL(10,2),
    "max_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_category_price_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_history_product_idx" ON "public"."product_history"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_history_changed_by_idx" ON "public"."product_history"("changed_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_history_created_at_idx" ON "public"."product_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_category_price_limits_store_idx" ON "public"."product_category_price_limits"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "unique_category_price_limit_per_store" ON "public"."product_category_price_limits"("store_id", "category");

-- AddForeignKey
ALTER TABLE "public"."product_history" ADD CONSTRAINT "product_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."product_history" ADD CONSTRAINT "product_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."product_category_price_limits" ADD CONSTRAINT "product_category_price_limits_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

