import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  createIntent(@UserRequest() user: AuthenticatedUser, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(
      user.tenantId,
      user.id,
      dto.dueId,
      dto.idempotencyKey,
      dto.provider ?? 'mock',
    );
  }

  /** Development-only provider simulation. Real providers will call signed webhooks. */
  @Post('mock/:paymentId/succeed')
  confirmMockPayment(@UserRequest() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.confirmMockPayment(user.tenantId, user.id, paymentId);
  }
}
