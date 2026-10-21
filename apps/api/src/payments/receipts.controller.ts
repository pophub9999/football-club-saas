import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AuthenticatedUser } from '../auth/auth.types';
import { PaymentsService } from './payments.service';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  list(@UserRequest() user: AuthenticatedUser) {
    return this.paymentsService.getReceipts(user.tenantId, user.id);
  }

  @Get(':receiptId')
  get(@UserRequest() user: AuthenticatedUser, @Param('receiptId') receiptId: string) {
    return this.paymentsService.getReceipt(user.tenantId, user.id, receiptId);
  }
}
