import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import type { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import type { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';

@Injectable()
export class KnowledgeBasesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.knowledgeBase.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const knowledgeBase = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    if (!knowledgeBase) {
      throw new NotFoundException('Knowledge base not found');
    }
    return knowledgeBase;
  }

  async create(dto: CreateKnowledgeBaseDto, actorId: string) {
    this.validateChunkSettings(dto.chunkSize ?? 800, dto.chunkOverlap ?? 120);

    return this.prisma.$transaction(async (tx) => {
      const knowledgeBase = await tx.knowledgeBase.create({
        data: { ...dto, createdById: actorId },
      });
      await tx.operationLog.create({
        data: {
          actorId,
          action: 'KNOWLEDGE_BASE_CREATE',
          resourceType: 'KNOWLEDGE_BASE',
          resourceId: knowledgeBase.id,
          detail: { name: knowledgeBase.name },
        },
      });
      return knowledgeBase;
    });
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto, actorId: string) {
    const current = await this.findOne(id);
    this.validateChunkSettings(
      dto.chunkSize ?? current.chunkSize,
      dto.chunkOverlap ?? current.chunkOverlap,
    );

    return this.prisma.$transaction(async (tx) => {
      const knowledgeBase = await tx.knowledgeBase.update({ where: { id }, data: dto });
      await tx.operationLog.create({
        data: {
          actorId,
          action: 'KNOWLEDGE_BASE_UPDATE',
          resourceType: 'KNOWLEDGE_BASE',
          resourceId: id,
          detail: { changedFields: Object.keys(dto) },
        },
      });
      return knowledgeBase;
    });
  }

  async remove(id: string, actorId: string) {
    const current = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.knowledgeBase.delete({ where: { id } });
      await tx.operationLog.create({
        data: {
          actorId,
          action: 'KNOWLEDGE_BASE_DELETE',
          resourceType: 'KNOWLEDGE_BASE',
          resourceId: id,
          detail: { name: current.name },
        },
      });
    });
    return { id };
  }

  private validateChunkSettings(chunkSize: number, chunkOverlap: number) {
    if (chunkOverlap >= chunkSize) {
      throw new BadRequestException('Chunk overlap must be smaller than chunk size');
    }
  }
}

