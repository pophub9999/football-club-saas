import { IsOptional, IsString, Length } from 'class-validator';

export class ScanTicketDto {
  @IsString()
  @Length(20, 4096)
  payload!: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  deviceId?: string;
}
