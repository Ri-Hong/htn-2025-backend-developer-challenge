/*
  Warnings:

  - You are about to drop the column `activity_category` on the `Scan` table. All the data in the column will be lost.
  - You are about to drop the column `activity_name` on the `Scan` table. All the data in the column will be lost.
  - Added the required column `activityId` to the `Scan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scan" DROP COLUMN "activity_category",
DROP COLUMN "activity_name",
ADD COLUMN     "activityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_name_key" ON "Activity"("name");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add check constraint to User table
ALTER TABLE "User"
ADD CONSTRAINT badge_code_not_empty CHECK (badge_code IS NOT NULL AND length(badge_code) > 0);
