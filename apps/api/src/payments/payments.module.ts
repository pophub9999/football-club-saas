import { Module } from '@nestjs/common';
import { PaymentHistoryController } from './payment-history.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ReceiptsController } from './receipts.controller';

@Module({
  controllers: [PaymentsController, PaymentHistoryController, ReceiptsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
