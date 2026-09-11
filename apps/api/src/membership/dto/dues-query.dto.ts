import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DuesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}
