export type BankInfo = {
  id: number;
  accountId: number;
  iban: string;
  bic: string | null;
  holderName: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
};
