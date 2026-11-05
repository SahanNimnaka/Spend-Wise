import type { LucideIcon } from "lucide-react";
import { Car, Coffee, ShoppingBag, Wallet, Zap } from "lucide-react";

import type { TransactionType } from "../types/api";

export type TransactionVisual = {
  icon: LucideIcon;
  color: "orange" | "green" | "purple" | "blue" | "yellow";
};

const CATEGORY_VISUALS: Record<string, TransactionVisual> = {
  "food & groceries": { icon: ShoppingBag, color: "orange" },
  "food & drinks": { icon: Coffee, color: "purple" },
  transportation: { icon: Car, color: "blue" },
  transport: { icon: Car, color: "blue" },
  shopping: { icon: ShoppingBag, color: "orange" },
  "bills & utilities": { icon: Zap, color: "yellow" },
  utilities: { icon: Zap, color: "yellow" },
  entertainment: { icon: Coffee, color: "purple" },
};

export function getTransactionVisual(
  category: string,
  type: TransactionType,
): TransactionVisual {
  if (type === "INCOME") {
    return { icon: Wallet, color: "green" };
  }

  return (
    CATEGORY_VISUALS[category.trim().toLowerCase()] ?? {
      icon: ShoppingBag,
      color: "orange",
    }
  );
}
