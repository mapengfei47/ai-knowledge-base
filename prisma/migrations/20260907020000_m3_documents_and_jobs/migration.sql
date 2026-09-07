CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "knowledge_base_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "queue_job_id" VARCHAR(120) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'WAITING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ingestion_jobs_queue_job_id_key" ON "ingestion_jobs"("queue_job_id");
CREATE INDEX "documents_knowledge_base_id_idx" ON "documents"("knowledge_base_id");
CREATE INDEX "documents_status_idx" ON "documents"("status");
CREATE INDEX "ingestion_jobs_document_id_created_at_idx" ON "ingestion_jobs"("document_id", "created_at");
CREATE INDEX "ingestion_jobs_status_idx" ON "ingestion_jobs"("status");

ALTER TABLE "documents"
ADD CONSTRAINT "documents_knowledge_base_id_fkey"
FOREIGN KEY ("knowledge_base_id") REFERENCES "knowledge_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ingestion_jobs"
ADD CONSTRAINT "ingestion_jobs_document_id_fkey"
FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

