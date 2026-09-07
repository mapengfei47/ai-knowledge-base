CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_bases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "chunk_size" INTEGER NOT NULL DEFAULT 800,
    "chunk_overlap" INTEGER NOT NULL DEFAULT 120,
    "top_k" INTEGER NOT NULL DEFAULT 5,
    "similarity_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    "chat_model" VARCHAR(160) NOT NULL DEFAULT 'openai/gpt-4o-mini',
    "embedding_model" VARCHAR(160) NOT NULL DEFAULT 'openai/text-embedding-3-small',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "resource_type" VARCHAR(80) NOT NULL,
    "resource_id" VARCHAR(80),
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "knowledge_bases_created_by_id_idx" ON "knowledge_bases"("created_by_id");
CREATE INDEX "operation_logs_actor_id_idx" ON "operation_logs"("actor_id");
CREATE INDEX "operation_logs_resource_type_resource_id_idx" ON "operation_logs"("resource_type", "resource_id");

ALTER TABLE "knowledge_bases"
ADD CONSTRAINT "knowledge_bases_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "operation_logs"
ADD CONSTRAINT "operation_logs_actor_id_fkey"
FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

