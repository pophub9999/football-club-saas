import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { TicketsService } from './tickets.service';

@Controller('tickets/transfers')
@UseGuards(JwtAuthGuard)
export class TicketTransfersController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('incoming')
  incoming(@UserRequest() user: AuthenticatedUser) {
    return this.ticketsService.listIncomingTransfers(user.tenantId, user.id);
  }

  @Get('outgoing')
  outgoing(@UserRequest() user: AuthenticatedUser) {
    return this.ticketsService.listOutgoingTransfers(user.tenantId, user.id);
  }
}
