import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketScannerService } from './ticket-scanner.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketScannerService],
  exports: [TicketsService, TicketScannerService],
})
export class TicketsModule {}
