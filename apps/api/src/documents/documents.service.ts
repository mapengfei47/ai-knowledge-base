import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { IngestionQueueService } from './ingestion-queue.service';

const MIME_BY_EXTENSION: Record<string, Set<string>> = {
  '.pdf': new Set(['application/pdf', 'application/octet-stream']),
  '.md': new Set(['text/markdown', 'text/plain', 'application/octet-stream']),
  '.txt': new Set(['text/plain', 'application/octet-stream']),
};

const documentResponseSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  knowledgeBase: { select: { id: true, name: true } },
  ingestionJobs: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} as const;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: IngestionQueueService,
  ) {}

  findAll() {
    return this.prisma.document.findMany({
      select: documentResponseSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(file: Express.Multer.File, knowledgeBaseId: string, actorId: string) {
    let trackedInDatabase = false;
    try {
      this.validateFile(file);
      const knowledgeBase = await this.prisma.knowledgeBase.findUnique({ where: { id: knowledgeBaseId } });
      if (!knowledgeBase) throw new NotFoundException('Knowledge base not found');

      const ingestionJobId = randomUUID();
      const queueJobId = `ingestion-${ingestionJobId}`;
      const document = await this.prisma.$transaction(async (tx) => {
        const created = await tx.document.create({
          data: {
            knowledgeBaseId,
            originalName: file.originalname,
            storagePath: resolve(file.path),
            mimeType: file.mimetype,
            size: file.size,
          },
        });
        await tx.ingestionJob.create({
          data: { id: ingestionJobId, documentId: created.id, queueJobId },
        });
        await tx.operationLog.create({
          data: {
            actorId,
            action: 'DOCUMENT_UPLOAD',
            resourceType: 'DOCUMENT',
            resourceId: created.id,
            detail: { originalName: created.originalName, knowledgeBaseId },
          },
        });
        return created;
      });
      trackedInDatabase = true;

      try {
        await this.queue.enqueue(queueJobId, document.id, ingestionJobId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to enqueue document';
        await this.markEnqueueFailure(document.id, ingestionJobId, message);
      }
      return this.findOne(document.id);
    } catch (error) {
      // Validation or DB failures must not leave an untracked upload on disk.
      if (!trackedInDatabase) await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  async retry(id: string, actorId: string) {
    const document = await this.findDocument(id);
    if (document.status !== 'FAILED') {
      throw new ConflictException('Only failed documents can be retried');
    }

    const activeJob = await this.prisma.ingestionJob.findFirst({
      where: { documentId: id, status: { in: ['WAITING', 'PROCESSING'] } },
    });
    if (activeJob) throw new ConflictException('Document already has an active job');

    const ingestionJobId = randomUUID();
    const queueJobId = `ingestion-${ingestionJobId}`;
    await this.prisma.$transaction(async (tx) => {
      await tx.document.update({ where: { id }, data: { status: 'PENDING', errorMessage: null } });
      await tx.ingestionJob.create({ data: { id: ingestionJobId, documentId: id, queueJobId } });
      await tx.operationLog.create({
        data: { actorId, action: 'DOCUMENT_RETRY', resourceType: 'DOCUMENT', resourceId: id },
      });
    });

    try {
      await this.queue.enqueue(queueJobId, id, ingestionJobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to enqueue document';
      await this.markEnqueueFailure(id, ingestionJobId, message);
    }
    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const document = await this.findDocument(id);
    const activeJob = await this.prisma.ingestionJob.findFirst({
      where: { documentId: id, status: { in: ['WAITING', 'PROCESSING'] } },
    });
    if (activeJob) throw new ConflictException('Wait for document processing to finish before deleting');

    await this.prisma.$transaction(async (tx) => {
      await tx.document.delete({ where: { id } });
      await tx.operationLog.create({
        data: {
          actorId,
          action: 'DOCUMENT_DELETE',
          resourceType: 'DOCUMENT',
          resourceId: id,
          detail: { originalName: document.originalName },
        },
      });
    });
    await unlink(document.storagePath).catch(() => undefined);
    return { id };
  }

  private async findOne(id: string) {
    return this.prisma.document.findUniqueOrThrow({
      where: { id },
      select: documentResponseSelect,
    });
  }

  private async findDocument(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  private validateFile(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();
    const allowedMimes = MIME_BY_EXTENSION[extension];
    if (!allowedMimes || !allowedMimes.has(file.mimetype)) {
      throw new BadRequestException('Only PDF, Markdown, and TXT files are supported');
    }
    if (file.size === 0) throw new BadRequestException('Uploaded file is empty');
    if (file.originalname.length > 255) throw new BadRequestException('Filename is too long');
  }

  private async markEnqueueFailure(documentId: string, ingestionJobId: string, message: string) {
    await this.prisma.$transaction([
      this.prisma.document.update({ where: { id: documentId }, data: { status: 'FAILED', errorMessage: message } }),
      this.prisma.ingestionJob.update({
        where: { id: ingestionJobId },
        data: { status: 'FAILED', errorMessage: message, finishedAt: new Date() },
      }),
    ]);
  }
}
