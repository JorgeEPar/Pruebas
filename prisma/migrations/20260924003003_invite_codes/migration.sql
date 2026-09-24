-- CreateTable
CREATE TABLE "invite_codes" (
    "code" VARCHAR(32) NOT NULL,
    "label" VARCHAR(120),
    "maxUses" INTEGER NOT NULL DEFAULT 50,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("code")
);
