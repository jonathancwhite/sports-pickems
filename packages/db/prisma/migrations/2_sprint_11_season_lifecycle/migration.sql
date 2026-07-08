-- Sprint 11: Season lifecycle, commissioner transfer, league deletion counting

CREATE TYPE "commissioner_transfer_status" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

ALTER TYPE "notification_type" ADD VALUE 'season_ended';

ALTER TABLE "seasons" ADD COLUMN "completed_at" TIMESTAMPTZ(6);

ALTER TABLE "leagues" ADD COLUMN "counts_toward_limit" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "commissioner_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "league_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "status" "commissioner_transfer_status" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissioner_transfers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "commissioner_transfers_league_status_idx" ON "commissioner_transfers"("league_id", "status");
CREATE INDEX "commissioner_transfers_to_user_status_idx" ON "commissioner_transfers"("to_user_id", "status");

ALTER TABLE "commissioner_transfers" ADD CONSTRAINT "commissioner_transfers_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commissioner_transfers" ADD CONSTRAINT "commissioner_transfers_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commissioner_transfers" ADD CONSTRAINT "commissioner_transfers_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
