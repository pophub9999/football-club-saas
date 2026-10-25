import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { TicketsService } from './tickets.service';
import { TicketScannerService } from './ticket-scanner.service';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { ScanTicketDto } from './dto/scan-ticket.dto';

const SCANNER_ROLES = new Set(['club_owner', 'club_admin', 'ticket_admin', 'stadium_manager']);

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService, private readonly scannerService: TicketScannerService) {}

  @Get()
  list(@UserRequest() user: AuthenticatedUser) { return this.ticketsService.listMyTickets(user.tenantId, user.id); }

  @Get('events')
  events(@UserRequest() user: AuthenticatedUser) { return this.ticketsService.listEvents(user.tenantId); }

  @Get('transfers/incoming')
  incomingTransfers(@UserRequest() user: AuthenticatedUser) { return this.ticketsService.listIncomingTransfers(user.tenantId, user.id); }

  @Post(':ticketId/transfer')
  transfer(@UserRequest() user: AuthenticatedUser, @Param('ticketId') ticketId: string, @Body() dto: TransferTicketDto) { return this.ticketsService.requestTransfer(user.tenantId, user.id, ticketId, dto); }

  @Post('transfers/:transferId/accept')
  acceptTransfer(@UserRequest() user: AuthenticatedUser, @Param('transferId') transferId: string) { return this.ticketsService.acceptTransfer(user.tenantId, user.id, transferId); }

  @Post('scan')
  scan(@UserRequest() user: AuthenticatedUser, @Body() dto: ScanTicketDto) {
    if (!user.roles.some((role) => SCANNER_ROLES.has(role))) throw new ForbiddenException('Insufficient permissions to scan tickets');
    return this.scannerService.scan(user.tenantId, user.id, dto);
  }

  @Get(':ticketId/qr')
  qr(@UserRequest() user: AuthenticatedUser, @Param('ticketId') ticketId: string) { return this.ticketsService.getQrPayload(user.tenantId, user.id, ticketId); }

  @Get(':ticketId')
  get(@UserRequest() user: AuthenticatedUser, @Param('ticketId') ticketId: string) { return this.ticketsService.getMyTicket(user.tenantId, user.id, ticketId); }
}
