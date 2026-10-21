import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { ClubsService } from './clubs.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

@Controller('admin/clubs')
@UseGuards(JwtAuthGuard)
export class AdminClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Put('branding')
  updateBranding(@UserRequest() user: AuthenticatedUser, @Body() dto: UpdateBrandingDto) {
    return this.clubsService.updateBranding(user.tenantId, user.id, user.roles, dto);
  }
}
