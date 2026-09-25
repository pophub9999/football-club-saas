import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import {
  ErpConnector,
  ErpDue,
  ErpMember,
  ErpMembership,
  ErpPaymentResult,
  ErpReceipt,
  RegisterPaymentInput,
} from './erp.types';

@Injectable()
export class MockErpConnector implements ErpConnector {
  private readonly receipts = new Map<string, ErpReceipt>();

  async getMember(tenantId: string, externalMemberId: string): Promise<ErpMember | null> {
    return {
      externalId: externalMemberId,
      memberNumber: `MOCK-${externalMemberId.slice(0, 8)}`,
      firstName: 'Mock',
      lastName: 'Member',
      email: `${externalMemberId}@mock-erp.local`,
    };
  }

  async getMembership(tenantId: string, externalMembershipId: string): Promise<ErpMembership | null> {
    return {
      externalId: externalMembershipId,
      planCode: 'STANDARD',
      status: 'ACTIVE',
      validFrom: new Date(0),
    };
  }

  async getDues(tenantId: string, externalMemberId: string): Promise<ErpDue[]> {
    return [];
  }

  async registerPayment(input: RegisterPaymentInput): Promise<ErpPaymentResult> {
    const suffix = input.paymentExternalId.slice(0, 12);
    const externalId = `MOCK-PAY-${suffix}`;
    const receiptExternalId = `MOCK-REC-${suffix}`;
    const receiptNumber = `MOCK-${new Date(input.paidAt).getUTCFullYear()}-${suffix}`;
    const registeredAt = new Date();

    this.receipts.set(`${input.tenantId}:${receiptExternalId}`, {
      externalId: receiptExternalId,
      receiptNumber,
      issuedAt: registeredAt,
      amount: new Decimal(input.amount),
      currency: input.currency,
    });

    return {
      externalId,
      status: 'REGISTERED',
      registeredAt,
      receiptExternalId,
      receiptNumber,
    };
  }

  async getReceipt(tenantId: string, receiptExternalId: string): Promise<ErpReceipt | null> {
    return this.receipts.get(`${tenantId}:${receiptExternalId}`) ?? null;
  }
}
