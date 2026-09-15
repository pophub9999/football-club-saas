import { Decimal } from '@prisma/client/runtime/library';

export interface ErpMember {
  externalId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ErpMembership {
  externalId: string;
  planCode: string;
  status: string;
  validFrom: Date;
  validUntil?: Date;
}

export interface ErpDue {
  externalId: string;
  reference: string;
  description?: string;
  amount: Decimal;
  paidAmount: Decimal;
  currency: string;
  dueDate: Date;
  status: string;
}

export interface RegisterPaymentInput {
  tenantId: string;
  dueExternalId?: string;
  paymentExternalId: string;
  amount: Decimal;
  currency: string;
  paidAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ErpPaymentResult {
  externalId: string;
  status: 'REGISTERED';
  registeredAt: Date;
  receiptExternalId: string;
  receiptNumber: string;
}

export interface ErpReceipt {
  externalId: string;
  receiptNumber: string;
  issuedAt: Date;
  amount: Decimal;
  currency: string;
  documentUrl?: string;
}

export interface ErpConnector {
  getMember(tenantId: string, externalMemberId: string): Promise<ErpMember | null>;
  getMembership(tenantId: string, externalMembershipId: string): Promise<ErpMembership | null>;
  getDues(tenantId: string, externalMemberId: string): Promise<ErpDue[]>;
  registerPayment(input: RegisterPaymentInput): Promise<ErpPaymentResult>;
  getReceipt(tenantId: string, receiptExternalId: string): Promise<ErpReceipt | null>;
}
