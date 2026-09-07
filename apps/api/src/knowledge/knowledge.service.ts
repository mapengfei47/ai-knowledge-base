import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { CreateKnowledgeDto, UpdateKnowledgeDto } from './knowledge.dto';
import { KnowledgeItem } from './knowledge.entity';

export type CachedResult<T> = { data: T; cache: 'HIT' | 'MISS' };

@Injectable()
export class KnowledgeService {
  private readonly listKey = 'knowledge:list';

  constructor(
    @InjectRepository(KnowledgeItem) private readonly repository: Repository<KnowledgeItem>,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<CachedResult<KnowledgeItem[]>> {
    const cached = await this.cache.get<KnowledgeItem[]>(this.listKey);
    if (cached) return { data: cached, cache: 'HIT' };
    const data = await this.repository.find({ order: { updatedAt: 'DESC' } });
    await this.cache.set(this.listKey, data);
    return { data, cache: 'MISS' };
  }

  async findOne(id: string): Promise<CachedResult<KnowledgeItem>> {
    const key = this.itemKey(id);
    const cached = await this.cache.get<KnowledgeItem>(key);
    if (cached) return { data: cached, cache: 'HIT' };
    const data = await this.repository.findOneBy({ id });
    if (!data) throw new NotFoundException('Knowledge item not found');
    await this.cache.set(key, data);
    return { data, cache: 'MISS' };
  }

  async create(input: CreateKnowledgeDto): Promise<KnowledgeItem> {
    const item = await this.repository.save(this.repository.create(input));
    await this.cache.del(this.listKey);
    return item;
  }

  async update(id: string, input: UpdateKnowledgeDto): Promise<KnowledgeItem> {
    const item = await this.repository.preload({ id, ...input });
    if (!item) throw new NotFoundException('Knowledge item not found');
    const saved = await this.repository.save(item);
    await this.cache.del(this.listKey, this.itemKey(id));
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundException('Knowledge item not found');
    await this.cache.del(this.listKey, this.itemKey(id));
  }

  private itemKey(id: string) {
    return `knowledge:item:${id}`;
  }
}

