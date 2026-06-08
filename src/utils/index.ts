// src/utils/index.ts
import { Timestamp } from "firebase/firestore";

// Format currency IDR
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date: Date | Timestamp | string): string => {
  let d: Date;
  if (date instanceof Timestamp) d = date.toDate();
  else if (typeof date === "string") d = new Date(date);
  else d = date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(d);
};

export const formatDateTime = (date: Date | Timestamp): string => {
  let d: Date;
  if (date instanceof Timestamp) d = date.toDate();
  else d = date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
};

export const formatDateInput = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const getToday = (): string => formatDateInput(new Date());

export const getStartOfMonth = (): string => {
  const d = new Date();
  return formatDateInput(new Date(d.getFullYear(), d.getMonth(), 1));
};

// Generate transaction number
export const generateTransactionNumber = (): string => {
  const now = new Date();
  const prefix = "TRX";
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${date}-${rand}`;
};

// Calculate cart totals
export const calculateCartTotals = (items: { qty: number; discount: number; product: { price: number } }[]) => {
  let subtotal = 0;
  let totalDiscount = 0;
  for (const item of items) {
    const itemSubtotal = item.product.price * item.qty;
    const discountAmount = (itemSubtotal * item.discount) / 100;
    subtotal += itemSubtotal;
    totalDiscount += discountAmount;
  }
  return { subtotal, totalDiscount, total: subtotal - totalDiscount };
};

// Percentage change
export const percentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Truncate text
export const truncate = (text: string, length: number): string => {
  return text.length > length ? text.slice(0, length) + "…" : text;
};

// Debounce
export const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number): T => {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
};

// Get date range for last N days
export const getDateRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  return { start: formatDateInput(start), end: formatDateInput(end) };
};
