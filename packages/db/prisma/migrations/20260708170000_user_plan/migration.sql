-- CreateEnum
CREATE TYPE "user_plan" AS ENUM ('free', 'pro');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan" "user_plan" NOT NULL DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN "pro_since" TIMESTAMPTZ(6);
