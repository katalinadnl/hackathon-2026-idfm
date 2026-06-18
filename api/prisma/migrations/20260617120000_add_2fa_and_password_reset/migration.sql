-- AlterTable
ALTER TABLE "Account" ADD COLUMN "twoFactorCode" TEXT,
ADD COLUMN "twoFactorExpiresAt" TIMESTAMP(3),
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Account_resetPasswordToken_key" ON "Account"("resetPasswordToken");
