import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { KnowledgeItem } from './knowledge.entity';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
  const item = { id: '8bc92395-11c8-4b26-ac99-e2502f503a54', title: 'Redis', content: 'Cache aside', tag: 'ops' } as KnowledgeItem;
  let repository: jest.Mocked<Pick<Repository<KnowledgeItem>, 'find' | 'findOneBy' | 'create' | 'save' | 'preload' | 'delete'>>;
  let cache: jest.Mocked<Pick<CacheService, 'get' | 'set' | 'del'>>;
  let service: KnowledgeService;

  beforeEach(() => {
    repository = { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn(), preload: jest.fn(), delete: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    service = new KnowledgeService(repository as unknown as Repository<KnowledgeItem>, cache as unknown as CacheService);
  });

  it('serves a cached list without querying Postgres', async () => {
    cache.get.mockResolvedValue([item]);
    await expect(service.findAll()).resolves.toEqual({ data: [item], cache: 'HIT' });
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('loads and caches a list after a miss', async () => {
    cache.get.mockResolvedValue(null);
    repository.find.mockResolvedValue([item]);
    await expect(service.findAll()).resolves.toEqual({ data: [item], cache: 'MISS' });
    expect(cache.set).toHaveBeenCalledWith('knowledge:list', [item]);
  });

  it('invalidates list and item keys after an update', async () => {
    repository.preload.mockResolvedValue(item);
    repository.save.mockResolvedValue(item);
    await service.update(item.id, { title: 'Redis' });
    expect(cache.del).toHaveBeenCalledWith('knowledge:list', `knowledge:item:${item.id}`);
  });

  it('returns 404 when deleting an unknown item', async () => {
    repository.delete.mockResolvedValue({ raw: [], affected: 0 });
    await expect(service.remove(item.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});

