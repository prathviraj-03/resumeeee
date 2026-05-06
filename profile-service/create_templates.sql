CREATE TABLE IF NOT EXISTS "resume_templates" (
    "template_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "file_size" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_templates_pkey" PRIMARY KEY ("template_id")
);

CREATE INDEX IF NOT EXISTS "idx_templates_user_id" ON "resume_templates"("user_id");
