-- AlterTable
ALTER TABLE `orders` ADD COLUMN `paymentIntentId` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NULL;
