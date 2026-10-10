import { Injectable } from '@nestjs/common';
import { MockErpConnector } from './mock-erp.connector';
import { ErpConnector, RegisterPaymentInput } from './erp.types';

@Injectable()
export class ErpService {
  constructor(private readonly mockConnector: MockErpConnector) {}

  private connectorForTenant(_tenantId: string): ErpConnector {
    return this.mockConnector;
  }

  getMember(tenantId: string, externalMemberId: string) {
    return this.connectorForTenant(tenantId).getMember(tenantId, externalMemberId);
  }

  getMembership(tenantId: string, externalMembershipId: string) {
    return this.connectorForTenant(tenantId).getMembership(tenantId, externalMembershipId);
  }

  getDues(tenantId: string, externalMemberId: string) {
    return this.connectorForTenant(tenantId).getDues(tenantId, externalMemberId);
  }

  registerPayment(input: RegisterPaymentInput) {
    return this.connectorForTenant(input.tenantId).registerPayment(input);
  }

  getReceipt(tenantId: string, receiptExternalId: string) {
    return this.connectorForTenant(tenantId).getReceipt(tenantId, receiptExternalId);
  }
}
