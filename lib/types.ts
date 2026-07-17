export type AccountKind =
  | "asset"
  | "liability"
  | "income"
  | "expense"
  | "equity";

export type TransactionType = "income" | "expense" | "transfer" | "adjustment";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "esewa"
  | "khalti"
  | "ime_pay"
  | "card"
  | "cheque"
  | "other";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  kind: AccountKind;
  subtype: string | null;
  icon: string | null;
  color: string | null;
  currency: string;
  is_archived: boolean;
  is_system: boolean;
  sort_order: number;
}

export interface AccountBalance extends Omit<Account, "is_system" | "user_id"> {
  user_id: string;
  balance: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  occurred_on: string;
  account_id: string;
  category_id: string | null;
  counter_account_id: string | null;
  payment_method: PaymentMethod | null;
  description: string | null;
  location: string | null;
  created_at: string;
}

/** Transaction joined with account/category names for list views. */
export interface TransactionWithNames extends Transaction {
  account: { name: string } | null;
  category: { name: string; icon: string | null } | null;
  counter_account: { name: string } | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank",
  esewa: "eSewa",
  khalti: "Khalti",
  ime_pay: "IME Pay",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};
