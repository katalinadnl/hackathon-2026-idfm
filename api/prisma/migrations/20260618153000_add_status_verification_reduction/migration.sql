ALTER TABLE "StatusVerification" ADD COLUMN "tariffReductionId" INTEGER;

ALTER TABLE "StatusVerification" ADD CONSTRAINT "StatusVerification_tariffReductionId_fkey" FOREIGN KEY ("tariffReductionId") REFERENCES "TariffReduction"("id") ON DELETE SET NULL ON UPDATE CASCADE;