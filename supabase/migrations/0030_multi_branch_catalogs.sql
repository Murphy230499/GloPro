-- 0030_multi_branch_catalogs.sql

-- Drop existing foreign keys
ALTER TABLE "service" DROP CONSTRAINT IF EXISTS "fk_service_branch_id";
ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "fk_product_branch_id";
ALTER TABLE "servicepackage" DROP CONSTRAINT IF EXISTS "fk_servicepackage_branch_id";
ALTER TABLE "treatment" DROP CONSTRAINT IF EXISTS "fk_treatment_branch_id";
ALTER TABLE "servicecombo" DROP CONSTRAINT IF EXISTS "fk_servicecombo_branch_id";
ALTER TABLE "productcombo" DROP CONSTRAINT IF EXISTS "fk_productcombo_branch_id";
ALTER TABLE "prepaidcard" DROP CONSTRAINT IF EXISTS "fk_prepaidcard_branch_id";

-- Add branch_ids columns
ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE "servicepackage" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE "treatment" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE "servicecombo" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE "productcombo" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE "prepaidcard" ADD COLUMN IF NOT EXISTS "branch_ids" UUID[] DEFAULT '{}'::uuid[];

-- Migrate data
UPDATE "service" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;
UPDATE "product" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;
UPDATE "servicepackage" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;
UPDATE "treatment" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;
UPDATE "servicecombo" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;
UPDATE "productcombo" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;
UPDATE "prepaidcard" SET "branch_ids" = ARRAY["branch_id"] WHERE "branch_id" IS NOT NULL;

-- Drop old branch_id columns
ALTER TABLE "service" DROP COLUMN IF EXISTS "branch_id";
ALTER TABLE "product" DROP COLUMN IF EXISTS "branch_id";
ALTER TABLE "servicepackage" DROP COLUMN IF EXISTS "branch_id";
ALTER TABLE "treatment" DROP COLUMN IF EXISTS "branch_id";
ALTER TABLE "servicecombo" DROP COLUMN IF EXISTS "branch_id";
ALTER TABLE "productcombo" DROP COLUMN IF EXISTS "branch_id";
ALTER TABLE "prepaidcard" DROP COLUMN IF EXISTS "branch_id";
