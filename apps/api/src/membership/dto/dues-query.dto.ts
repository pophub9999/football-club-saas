import { DueStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class DuesQueryDto {
  @IsOptional()
  @IsEnum(DueStatus)
  status?: DueStatus;
}
