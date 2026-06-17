export type Payment = {
  id: number;
  paidAt: string;
  amount: number;
  method: "card" | "direct_debit";
  status: "succeeded" | "failed";
};

export type Document = {
  id: number;
  type: "attestation" | "contrat";
  label: string;
  date: string;
  url: string;
};

export type AccountInfo = {
  id: number;
  email: string;
  accountNumber: string;
  beneficiary: { firstName: string; lastName: string } | null;
};

export type DeliveryStatus = "ordered" | "preparing" | "shipped" | "delivered";

export type Delivery = {
  status: DeliveryStatus;
  orderedAt: string;
  estimatedAt: string;
  trackingNumber: string | null;
};

export type Subscription = {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "blocked";
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
  referrer: AccountInfo | null;
  payer: AccountInfo | null;
  payments: Payment[];
  documents: Document[];
  delivery: Delivery | null;
};
