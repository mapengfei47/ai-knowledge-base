import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseUUIDPipe, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CreateKnowledgeDto, UpdateKnowledgeDto } from './knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get()
  async findAll(@Res({ passthrough: true }) response: Response) {
    const result = await this.service.findAll();
    response.setHeader('X-Cache', result.cache);
    return result.data;
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.findOne(id);
    response.setHeader('X-Cache', result.cache);
    return result.data;
  }

  @Post()
  create(@Body() input: CreateKnowledgeDto) {
    return this.service.create(input);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateKnowledgeDto) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @Header('Content-Type', 'application/json')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

