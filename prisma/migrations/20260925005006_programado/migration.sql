-- AlterTable
ALTER TABLE "invite_codes" ADD COLUMN     "daily_limit" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "invite_code" VARCHAR(32) NOT NULL,
    "topic" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "invite_code" VARCHAR(32) NOT NULL,
    "hora" INTEGER NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "channel" VARCHAR(16) NOT NULL DEFAULT 'email',
    "email_to" VARCHAR(320) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "invite_code" VARCHAR(32) NOT NULL,
    "generation_id" TEXT,
    "topic" VARCHAR(200) NOT NULL,
    "channel" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedules_invite_code_key" ON "schedules"("invite_code");

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_invite_code_fkey" FOREIGN KEY ("invite_code") REFERENCES "invite_codes"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_invite_code_fkey" FOREIGN KEY ("invite_code") REFERENCES "invite_codes"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_invite_code_fkey" FOREIGN KEY ("invite_code") REFERENCES "invite_codes"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
