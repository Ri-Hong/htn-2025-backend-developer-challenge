-- AlterTable
ALTER TABLE "User" ADD COLUMN     "check_in_at" TIMESTAMP(3),
ADD COLUMN     "check_out_at" TIMESTAMP(3),
ADD COLUMN     "checked_in" BOOLEAN NOT NULL DEFAULT false;
