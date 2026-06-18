CREATE TABLE "TransportProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indication" TEXT,
    "period" TEXT,
    "priceLabel" TEXT NOT NULL,
    "priceCents" INTEGER,
    "sellingArguments" TEXT[] NOT NULL,
    "subscriptionTag" TEXT,
    "portalUrl" TEXT,
    "rechargeUrl" TEXT,
    "imageUrl" TEXT,
    "isAnnualPlan" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportProduct_name_key" ON "TransportProduct"("name");