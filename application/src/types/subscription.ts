export type AddressType = "home" | "delivery" | "billing";

export type Address = {
  id: number;
  type: AddressType;
  isDefault: boolean;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
};

export type AccountInfo = {
  id: number;
  email: string;
  accountNumber: string;
  beneficiary: { firstName: string; lastName: string } | null;
};

export type PaymentMethod = "card" | "direct_debit";
export type PaymentStatus = "succeeded" | "failed" | "pending";

export type Payment = {
  id: number;
  paidAt: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
};

export type SubscriptionDocumentType = "attestation" | "contrat";

export type SubscriptionDocument = {
  id: number;
  type: SubscriptionDocumentType;
  label: string;
  date: string;
  url: string;
};

export type DeliveryReason = "initial_order" | "lost" | "stolen" | "damaged";
export type DeliveryStatus = "ordered" | "preparing" | "shipped" | "delivered";

export type Delivery = {
  status: DeliveryStatus;
  reason: DeliveryReason;
  orderedAt: string;
  estimatedAt: string | null;
  trackingNumber: string | null;
};

export type PassStatus = "active" | "blocked" | "replaced";

export type Pass = {
  id: number;
  navigoNumber: string;
  status: PassStatus;
  issuedAt: string;
  delivery: Delivery;
};

export type SubscriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "pending_cancellation";

export type SubscriptionResponse = {
  id: number;
  subscriptionType: string;
  transportProductId: number | null;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  clientNumber: string;
  renewed: boolean;
  reference: string;
  beneficiary: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    residenceDepartment: { name: string };
    addresses: Address[];
  };

  account: { email: string } | null;
  referrer: AccountInfo | null;
  payer: AccountInfo | null;
  payments: Payment[];
  documents: SubscriptionDocument[];
  passes: Pass[];
};
