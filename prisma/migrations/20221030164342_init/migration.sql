-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF'
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'PARTNER'
);

-- CreateTable
CREATE TABLE "Structure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'STRUCTURE',
    CONSTRAINT "Structure_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Functionality" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "_FunctionalityToStructure" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FunctionalityToStructure_A_fkey" FOREIGN KEY ("A") REFERENCES "Functionality" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FunctionalityToStructure_B_fkey" FOREIGN KEY ("B") REFERENCES "Structure" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_city_key" ON "Partner"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_email_key" ON "Structure"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Structure_street_key" ON "Structure"("street");

-- CreateIndex
CREATE UNIQUE INDEX "Functionality_name_key" ON "Functionality"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_FunctionalityToStructure_AB_unique" ON "_FunctionalityToStructure"("A", "B");

-- CreateIndex
CREATE INDEX "_FunctionalityToStructure_B_index" ON "_FunctionalityToStructure"("B");
