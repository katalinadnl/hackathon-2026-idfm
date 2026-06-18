/*
  Warnings:

  - You are about to drop the column `email` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Beneficiary` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Beneficiary_email_key";

-- AlterTable
ALTER TABLE "Beneficiary" DROP COLUMN "email",
DROP COLUMN "phone";
