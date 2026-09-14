-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mandi" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mandi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commodity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" SERIAL NOT NULL,
    "mandiId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "arrivalQuantity" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'Quintal',
    "variety" TEXT,
    "grade" TEXT,
    "source" TEXT NOT NULL DEFAULT 'AGMARK',
    "sourceRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsRejected" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "source" TEXT NOT NULL DEFAULT 'AGMARK',
    "triggeredBy" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE INDEX "State_name_idx" ON "State"("name");

-- CreateIndex
CREATE INDEX "District_stateId_idx" ON "District"("stateId");

-- CreateIndex
CREATE INDEX "District_name_idx" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_stateId_key" ON "District"("name", "stateId");

-- CreateIndex
CREATE INDEX "Mandi_stateId_idx" ON "Mandi"("stateId");

-- CreateIndex
CREATE INDEX "Mandi_districtId_idx" ON "Mandi"("districtId");

-- CreateIndex
CREATE INDEX "Mandi_name_idx" ON "Mandi"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Mandi_name_stateId_districtId_key" ON "Mandi"("name", "stateId", "districtId");

-- CreateIndex
CREATE UNIQUE INDEX "Commodity_name_key" ON "Commodity"("name");

-- CreateIndex
CREATE INDEX "Commodity_name_idx" ON "Commodity"("name");

-- CreateIndex
CREATE INDEX "MarketPrice_mandiId_idx" ON "MarketPrice"("mandiId");

-- CreateIndex
CREATE INDEX "MarketPrice_commodityId_idx" ON "MarketPrice"("commodityId");

-- CreateIndex
CREATE INDEX "MarketPrice_arrivalDate_idx" ON "MarketPrice"("arrivalDate");

-- CreateIndex
CREATE INDEX "MarketPrice_commodityId_arrivalDate_idx" ON "MarketPrice"("commodityId", "arrivalDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_mandiId_commodityId_arrivalDate_key" ON "MarketPrice"("mandiId", "commodityId", "arrivalDate");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "IngestionLog_createdAt_idx" ON "IngestionLog"("createdAt");

-- CreateIndex
CREATE INDEX "IngestionLog_status_idx" ON "IngestionLog"("status");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandi" ADD CONSTRAINT "Mandi_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandi" ADD CONSTRAINT "Mandi_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "Mandi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
