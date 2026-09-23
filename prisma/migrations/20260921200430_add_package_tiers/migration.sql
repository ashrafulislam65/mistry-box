-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "packageTierId" TEXT,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tierLabel" TEXT;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "deliveryCharge" DECIMAL(10,2) NOT NULL DEFAULT 99;

-- CreateTable
CREATE TABLE "package_tiers" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_tiers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "package_tiers" ADD CONSTRAINT "package_tiers_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_packageTierId_fkey" FOREIGN KEY ("packageTierId") REFERENCES "package_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
