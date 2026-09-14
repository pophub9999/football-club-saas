import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list(@UserRequest() user: AuthenticatedUser) {
    return this.ticketsService.listMyTickets(user.tenantId, user.id);
  }

  @Get('events')
  events(@UserRequest() user: AuthenticatedUser) {
    return this.ticketsService.listEvents(user.tenantId);
  }

  @Get(':ticketId/qr')
  qr(@UserRequest() user: AuthenticatedUser, @Param('ticketId') ticketId: string) {
    return this.ticketsService.getQrPayload(user.tenantId, user.id, ticketId);
  }

  @Get(':ticketId')
  get(@UserRequest() user: AuthenticatedUser, @Param('ticketId') ticketId: string) {
    return this.ticketsService.getMyTicket(user.tenantId, user.id, ticketId);
  }
}
