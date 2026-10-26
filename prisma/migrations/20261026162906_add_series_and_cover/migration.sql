-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "isCover" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Work" ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Series_order_idx" ON "Series"("order");

-- CreateIndex
CREATE INDEX "Work_seriesId_order_idx" ON "Work"("seriesId", "order");

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
