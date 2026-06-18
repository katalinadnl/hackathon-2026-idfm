export class AccountInfoDto {
  id: number;
  email: string;
  accountNumber: string;
  beneficiary: { firstName: string; lastName: string } | null;
}

export class PaymentDto {
  id: number;
  paidAt: string;
  amount: number;
  method: string;
  status: string;
}

export class DocumentDto {
  id: number;
  type: string;
  label: string;
  date: string;
  url: string;
}

export class DeliveryDto {
  status: 'ordered' | 'preparing' | 'shipped' | 'delivered';
  orderedAt: string;
  estimatedAt: string;
  trackingNumber: string | null;
}

export class SubscriptionResponseDto {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  transportProductId: number | null;
  startDate: string;
  endDate: string;
  status: string;
  clientNumber: string;
  renewed: boolean;

  beneficiary: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    residenceDepartment: { name: string };
  };

  account: { email: string } | null;
  referrer: AccountInfoDto | null;
  payer: AccountInfoDto | null;
  payments: PaymentDto[];
  documents: DocumentDto[];
  delivery: DeliveryDto | null;
}
