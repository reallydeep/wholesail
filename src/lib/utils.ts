import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCents(dollars: number | string) {
  const n = typeof dollars === "string" ? parseFloat(dollars.replace(/[^0-9.-]/g, "")) : dollars;
  return Math.round(n * 100);
}
