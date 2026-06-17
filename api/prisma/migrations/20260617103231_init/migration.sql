-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('client', 'admin');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "role" "AccountRole" NOT NULL DEFAULT 'client';
