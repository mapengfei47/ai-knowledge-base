import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { DocumentsService } from './documents.service';
import { documentStorage, MAX_UPLOAD_BYTES } from './upload-storage';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'knowledgeBaseId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        knowledgeBaseId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: documentStorage, limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('knowledgeBaseId', ParseUUIDPipe) knowledgeBaseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.documentsService.upload(file, knowledgeBaseId, user.id);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.retry(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.remove(id, user.id);
  }
}
