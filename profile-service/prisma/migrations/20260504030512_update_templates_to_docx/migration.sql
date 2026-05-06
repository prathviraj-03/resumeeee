/*
  Warnings:

  - You are about to drop the column `content` on the `resume_templates` table. All the data in the column will be lost.
  - Added the required column `file_url` to the `resume_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `public_id` to the `resume_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resume_templates" DROP COLUMN "content",
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "file_url" TEXT NOT NULL,
ADD COLUMN     "public_id" TEXT NOT NULL;
