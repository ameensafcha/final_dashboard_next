-- CreateTable
CREATE TABLE "test_table2" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_table2_pkey" PRIMARY KEY ("id")
);
