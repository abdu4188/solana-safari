-- Modify the rewards table to use varchar for user_id
ALTER TABLE "rewards" ADD COLUMN "user_id_new" varchar(256);

-- Copy data from old column to new column (if any exists)
UPDATE "rewards" SET "user_id_new" = CAST("user_id" AS varchar);

-- Drop the foreign key constraint
ALTER TABLE "rewards" DROP CONSTRAINT IF EXISTS "rewards_user_id_users_id_fk";

-- Drop the old column
ALTER TABLE "rewards" DROP COLUMN "user_id";

-- Rename the new column
ALTER TABLE "rewards" RENAME COLUMN "user_id_new" TO "user_id";

-- Make the column not null
ALTER TABLE "rewards" ALTER COLUMN "user_id" SET NOT NULL;

-- Recreate the index
DROP INDEX IF EXISTS "rewards_user_id_idx";
CREATE INDEX "rewards_user_id_idx" ON "rewards" ("user_id"); 