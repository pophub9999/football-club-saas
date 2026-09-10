import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsUUID()
  dueId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;
}
