-- Add color palette preference alongside the light/dark theme setting.
ALTER TABLE "user_preferences" ADD COLUMN "palette" TEXT NOT NULL DEFAULT 'classic';
