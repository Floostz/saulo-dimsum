// src/types/index.ts

export type UserRole = "admin" | "kasir";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: "product" | "expense";
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;       // harga jual
  costPrice: number;   // harga modal
  stock: number;
  unit: string;        // pcs, porsi, box, etc.
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  qty: number;
  discount: number; // percentage 0-100
  subtotal: number;
}

export type PaymentMethod = "cash" | "qris" | "transfer";

export interface Transaction {
  id: string;
  transactionNumber: string;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  change?: number;
  cashierId: string;
  cashierName: string;
  note?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  supplier?: string;
  receiptUrl?: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;   // threshold for low stock alert
  costPerUnit: number;
  linkedProducts?: string[]; // product IDs that use this stock
  updatedAt: Date;
}

export interface FinanceSummary {
  date: string;          // YYYY-MM-DD
  income: number;
  expense: number;
  profit: number;
  transactionCount: number;
}

export interface DashboardStats {
  todayIncome: number;
  todayExpense: number;
  todayProfit: number;
  monthIncome: number;
  monthExpense: number;
  monthProfit: number;
  transactionCount: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  lowStockItems: StockItem[];
  dailySales: { date: string; income: number; expense: number }[];
}

export interface Report {
  id: string;
  type: "daily" | "monthly" | "yearly" | "custom";
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  transactions: Transaction[];
  expenses: Expense[];
  generatedBy: string;
  createdAt: Date;
}
