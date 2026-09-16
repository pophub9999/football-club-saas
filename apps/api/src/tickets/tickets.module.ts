import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketTransfersController } from './ticket-transfers.controller';
import { TicketsService } from './tickets.service';
import { TicketScannerService } from './ticket-scanner.service';

@Module({
  controllers: [TicketsController, TicketTransfersController],
  providers: [TicketsService, TicketScannerService],
  exports: [TicketsService, TicketScannerService],
})
export class TicketsModule {}
