import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AuthenticatedUser } from '../auth/auth.types';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentHistoryController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('history')
  history(@UserRequest() user: AuthenticatedUser) {
    return this.paymentsService.getPaymentHistory(user.tenantId, user.id);
  }

  @Get(':paymentId')
  get(@UserRequest() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.getPayment(user.tenantId, user.id, paymentId);
  }
}
