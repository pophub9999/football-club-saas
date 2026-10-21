import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class TransferTicketDto {
  @ValidateIf((value) => !value.recipientMemberNumber)
  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @ValidateIf((value) => !value.recipientEmail)
  @IsString()
  @IsOptional()
  recipientMemberNumber?: string;
}
