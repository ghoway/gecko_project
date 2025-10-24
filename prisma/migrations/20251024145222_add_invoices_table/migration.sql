-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `plan_name` VARCHAR(191) NOT NULL,
    `plan_price` DOUBLE NOT NULL,
    `plan_duration_days` INTEGER NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `payment_gateway` VARCHAR(191) NULL,
    `payment_type` VARCHAR(191) NULL,
    `discount_amount` DOUBLE NOT NULL DEFAULT 0,
    `tax_amount` DOUBLE NOT NULL DEFAULT 0,
    `final_amount` DOUBLE NOT NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `user_email` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_transaction_id_key`(`transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
