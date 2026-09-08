import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(2, 64)
  username!: string;

  @IsString()
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
