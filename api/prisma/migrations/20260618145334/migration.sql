-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('home', 'delivery', 'billing');

-- CreateEnum
CREATE TYPE "BeneficiaryStatus" AS ENUM ('ACTIVE', 'STUDENT', 'SENIOR', 'UNEMPLOYED', 'DISABLED', 'MINOR');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('active', 'blocked', 'replaced');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ordered', 'preparing', 'shipped', 'delivered');

-- CreateEnum
CREATE TYPE "DeliveryReason" AS ENUM ('initial_order', 'lost', 'stolen', 'damaged');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('client', 'admin');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'cancelled', 'pending_cancellation');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CARD_ONCE', 'SEPA_ONCE', 'SEPA_MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('succeeded', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "VerificationSource" AS ENUM ('MANUAL_DOCUMENT', 'STATE_API', 'DECLARATIVE');

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'home',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "socialSecurityNumber" TEXT,
    "status" "BeneficiaryStatus" NOT NULL DEFAULT 'ACTIVE',
    "accountTitulaireId" INTEGER,
    "accountReferantId" INTEGER,
    "residenceDepartmentId" INTEGER NOT NULL,
    "workStudyDepartmentId" INTEGER,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pass" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "navigoNumber" TEXT NOT NULL,
    "status" "PassStatus" NOT NULL DEFAULT 'active',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassUsage" (
    "id" SERIAL NOT NULL,
    "passId" INTEGER NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "station" TEXT,

    CONSTRAINT "PassUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" SERIAL NOT NULL,
    "passId" INTEGER NOT NULL,
    "addressId" INTEGER NOT NULL,
    "reason" "DeliveryReason" NOT NULL DEFAULT 'initial_order',
    "status" "DeliveryStatus" NOT NULL DEFAULT 'ordered',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedAt" TIMESTAMP(3),
    "trackingNumber" TEXT,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "AccountRole" NOT NULL DEFAULT 'client',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "stripeMandateId" TEXT,
    "stripePreviousMandateId" TEXT,
    "twoFactorCode" TEXT,
    "twoFactorExpiresAt" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpiresAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankInfo" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT,
    "holderName" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "subscriptionType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "cancelledAt" TIMESTAMP(3),
    "cancellationEffectiveAt" TIMESTAMP(3),
    "cancelledById" INTEGER,
    "bankInfoId" INTEGER NOT NULL,
    "transportProductId" INTEGER,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'SEPA_MONTHLY',
    "annualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyAmount" DOUBLE PRECISION,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMode" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'succeeded',

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusVerification" (
    "id" SERIAL NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "status" "BeneficiaryStatus" NOT NULL,
    "source" "VerificationSource" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "documentUrl" TEXT,
    "expirationDate" TIMESTAMP(3),
    "apiName" TEXT,
    "apiReference" TEXT,
    "apiQueriedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tariffReductionId" INTEGER,

    CONSTRAINT "StatusVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indication" TEXT,
    "period" TEXT,
    "priceLabel" TEXT NOT NULL,
    "priceCents" INTEGER,
    "sellingArguments" TEXT[],
    "subscriptionTag" TEXT,
    "portalUrl" TEXT,
    "rechargeUrl" TEXT,
    "imageUrl" TEXT,
    "isAnnualPlan" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffReduction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indication" TEXT,
    "reductionPercent" INTEGER,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "sellingArguments" TEXT[],
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseProductId" INTEGER,

    CONSTRAINT "TariffReduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_socialSecurityNumber_key" ON "Beneficiary"("socialSecurityNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_accountTitulaireId_key" ON "Beneficiary"("accountTitulaireId");

-- CreateIndex
CREATE UNIQUE INDEX "Pass_navigoNumber_key" ON "Pass"("navigoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_passId_key" ON "Delivery"("passId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_accountNumber_key" ON "Account"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Account_stripeCustomerId_key" ON "Account"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_resetPasswordToken_key" ON "Account"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_reference_key" ON "Subscription"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_subscriptionId_paidAt_amount_key" ON "Payment"("subscriptionId", "paidAt", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "TransportProduct_name_key" ON "TransportProduct"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TariffReduction_name_key" ON "TariffReduction"("name");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_accountTitulaireId_fkey" FOREIGN KEY ("accountTitulaireId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_accountReferantId_fkey" FOREIGN KEY ("accountReferantId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_residenceDepartmentId_fkey" FOREIGN KEY ("residenceDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_workStudyDepartmentId_fkey" FOREIGN KEY ("workStudyDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pass" ADD CONSTRAINT "Pass_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassUsage" ADD CONSTRAINT "PassUsage_passId_fkey" FOREIGN KEY ("passId") REFERENCES "Pass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_passId_fkey" FOREIGN KEY ("passId") REFERENCES "Pass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankInfo" ADD CONSTRAINT "BankInfo_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_bankInfoId_fkey" FOREIGN KEY ("bankInfoId") REFERENCES "BankInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_transportProductId_fkey" FOREIGN KEY ("transportProductId") REFERENCES "TransportProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusVerification" ADD CONSTRAINT "StatusVerification_tariffReductionId_fkey" FOREIGN KEY ("tariffReductionId") REFERENCES "TariffReduction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusVerification" ADD CONSTRAINT "StatusVerification_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffReduction" ADD CONSTRAINT "TariffReduction_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "TransportProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
