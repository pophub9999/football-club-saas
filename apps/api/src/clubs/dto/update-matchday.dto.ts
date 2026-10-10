import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MatchdayLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  mapUrl?: string;
}

export class MatchdayAccessDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(255)
  instructions!: string;
}

export class MatchdayParkingDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(255)
  instructions!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  mapUrl?: string;
}

export class MatchdayNoticeDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsBoolean()
  important?: boolean;
}

export class UpdateMatchdayDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MatchdayLocationDto)
  location?: MatchdayLocationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchdayAccessDto)
  entrances?: MatchdayAccessDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchdayParkingDto)
  parking?: MatchdayParkingDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchdayNoticeDto)
  notices?: MatchdayNoticeDto[];
}
