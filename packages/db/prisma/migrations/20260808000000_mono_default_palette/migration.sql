-- Mono becomes the default palette. Rows still on 'classic' only hold the old
-- column default — the palette picker never shipped before this change, so no
-- user has explicitly chosen it.
ALTER TABLE "user_preferences" ALTER COLUMN "palette" SET DEFAULT 'mono';
UPDATE "user_preferences" SET "palette" = 'mono' WHERE "palette" = 'classic';
