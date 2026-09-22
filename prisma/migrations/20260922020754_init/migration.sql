-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "text" VARCHAR(280) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);
