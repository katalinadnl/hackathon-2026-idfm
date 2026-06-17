-- Stripe linkage on Account (payers become Stripe customers)
ALTER TABLE "Account" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Account" ADD COLUMN "stripePaymentMethodId" TEXT;
ALTER TABLE "Account" ADD COLUMN "stripeMandateId" TEXT;

CREATE UNIQUE INDEX "Account_stripeCustomerId_key" ON "Account"("stripeCustomerId");