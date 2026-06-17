-- Keep the last revoked mandate so RIB-change history shows on the Stripe path
ALTER TABLE "Account" ADD COLUMN "stripePreviousMandateId" TEXT;