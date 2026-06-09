-- CreateTable
CREATE TABLE "CacheStatus" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CacheStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CacheStatus_key_key" ON "CacheStatus"("key");
