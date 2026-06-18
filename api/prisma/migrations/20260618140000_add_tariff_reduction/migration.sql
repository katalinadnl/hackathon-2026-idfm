CREATE TABLE "TariffReduction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indication" TEXT,
    "reductionPercent" INTEGER,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "sellingArguments" TEXT[] NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseProductId" INTEGER,

    CONSTRAINT "TariffReduction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TariffReduction_name_key" ON "TariffReduction"("name");

ALTER TABLE "TariffReduction" ADD CONSTRAINT "TariffReduction_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "TransportProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;