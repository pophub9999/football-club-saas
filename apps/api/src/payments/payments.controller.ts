import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { Request } from 'express';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  createIntent(@UserRequest() request: Request, @Body() dto: CreatePaymentIntentDto) {
    const user = request.user!;
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
  confirmMockPayment(@UserRequest() request: Request, @Param('paymentId') paymentId: string) {
    const user = request.user!;
    return this.paymentsService.confirmMockPayment(user.tenantId, user.id, paymentId);
  }
}
