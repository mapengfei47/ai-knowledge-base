import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKnowledgeItems1725700000000 implements MigrationInterface {
  name = 'CreateKnowledgeItems1725700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "knowledge_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar(120) NOT NULL,
        "content" text NOT NULL,
        "tag" varchar(40) NOT NULL DEFAULT 'general',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_knowledge_items" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "knowledge_items"');
  }
}

