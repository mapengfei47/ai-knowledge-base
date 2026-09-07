import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { KnowledgeBasesService } from './knowledge-bases.service';

@ApiTags('knowledge-bases')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('knowledge-bases')
export class KnowledgeBasesController {
  constructor(private readonly knowledgeBasesService: KnowledgeBasesService) {}

  @Get()
  findAll() {
    return this.knowledgeBasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.knowledgeBasesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateKnowledgeBaseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.knowledgeBasesService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeBasesService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.knowledgeBasesService.remove(id, user.id);
  }
}

