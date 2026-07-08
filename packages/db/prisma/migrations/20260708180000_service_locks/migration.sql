CREATE TABLE "service_locks" (
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "locked_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_locks_pkey" PRIMARY KEY ("name")
);
