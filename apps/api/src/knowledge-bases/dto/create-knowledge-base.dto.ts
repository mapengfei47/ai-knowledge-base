import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ example: '产品文档' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: string;

  @ApiPropertyOptional({ default: 800, minimum: 100, maximum: 4000 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(4000)
  chunkSize?: number;

  @ApiPropertyOptional({ default: 120, minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  chunkOverlap?: number;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ default: 0.65, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;

  @ApiPropertyOptional({ default: 'openai/gpt-4o-mini' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  chatModel?: string;

  @ApiPropertyOptional({ default: 'openai/text-embedding-3-small' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  embeddingModel?: string;
}

