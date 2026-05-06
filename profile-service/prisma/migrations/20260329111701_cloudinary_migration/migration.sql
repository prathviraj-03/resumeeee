/*
  Warnings:

  - You are about to drop the column `s3_storage_path` on the `resumes` table. All the data in the column will be lost.
  - Added the required column `cloudinary_public_id` to the `resumes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudinary_secure_url` to the `resumes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resumes" DROP COLUMN "s3_storage_path",
ADD COLUMN     "cloudinary_public_id" TEXT NOT NULL,
ADD COLUMN     "cloudinary_secure_url" TEXT NOT NULL;
