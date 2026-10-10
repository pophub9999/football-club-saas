export class TransferSummaryDto {
  id!: string;
  status!: string;
  expiresAt!: Date;
  createdAt!: Date;
  acceptedAt?: Date | null;
  ticket!: {
    id: string;
    ticketNumber: string;
    status: string;
    event: {
      id: string;
      name: string;
      startsAt: Date;
      venueName?: string | null;
    };
  };
  sender?: {
    id: string;
    email: string;
    name?: string | null;
  };
  recipient?: {
    id: string;
    email: string;
    name?: string | null;
  };
}
