import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;

  @IsString()
  @IsOptional()
  @Length(1, 40)
  tag?: string;
}

export class UpdateKnowledgeDto {
  @IsString()
  @IsOptional()
  @Length(2, 120)
  title?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(10000)
  content?: string;

  @IsString()
  @IsOptional()
  @Length(1, 40)
  tag?: string;
}

