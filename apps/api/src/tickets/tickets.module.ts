import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketScannerService } from './ticket-scanner.service';

@Module({
  imports: [NotificationsModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketScannerService],
  exports: [TicketsService, TicketScannerService],
})
export class TicketsModule {}
