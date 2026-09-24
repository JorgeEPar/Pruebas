-- CreateTable
CREATE TABLE "generations" (
    "id" TEXT NOT NULL,
    "invite_code" VARCHAR(32) NOT NULL,
    "input_kind" VARCHAR(10) NOT NULL,
    "input_text" TEXT,
    "output" JSONB NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_invite_code_fkey" FOREIGN KEY ("invite_code") REFERENCES "invite_codes"("code") ON DELETE CASCADE ON UPDATE CASCADE;
