import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { IngestionQueueService } from './ingestion-queue.service';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, IngestionQueueService],
})
export class DocumentsModule {}

