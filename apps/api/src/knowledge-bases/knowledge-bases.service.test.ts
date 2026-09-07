import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeBasesService } from './knowledge-bases.service';

describe('KnowledgeBasesService', () => {
  it('rejects overlap that is not smaller than chunk size', async () => {
    const prisma = { $transaction: vi.fn() };
    const service = new KnowledgeBasesService(prisma as never);

    await expect(service.create({ name: 'Invalid', chunkSize: 100, chunkOverlap: 100 }, 'actor-id'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

