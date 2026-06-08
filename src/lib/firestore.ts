// src/lib/firestore.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, limit,
  onSnapshot, Timestamp, writeBatch, serverTimestamp,
  DocumentData, QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Product, Transaction, Expense, StockItem, AppUser } from "../types";

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsRef = () => collection(db, "products");

export const getProducts = async (): Promise<Product[]> => {
  const q = query(productsRef(), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
};

export const addProduct = async (data: Omit<Product, "id">) => {
  return addDoc(productsRef(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  return updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteProduct = async (id: string) => deleteDoc(doc(db, "products", id));

export const subscribeProducts = (cb: (products: Product[]) => void) => {
  return onSnapshot(query(productsRef(), where("isActive", "==", true), orderBy("name")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
  });
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export const transactionsRef = () => collection(db, "transactions");

export const addTransaction = async (data: Omit<Transaction, "id">) => {
  const batch = writeBatch(db);
  // Add transaction
  const txRef = doc(transactionsRef());
  batch.set(txRef, { ...data, createdAt: serverTimestamp() });
  // Deduct stock for each item
  for (const item of data.items) {
    const prodRef = doc(db, "products", item.product.id);
    const newStock = Math.max(0, item.product.stock - item.qty);
    batch.update(prodRef, { stock: newStock, updatedAt: serverTimestamp() });
  }
  await batch.commit();
  return txRef;
};

export const getTransactions = async (startDate?: string, endDate?: string): Promise<Transaction[]> => {
  let q = query(transactionsRef(), orderBy("createdAt", "desc"), limit(100));
  if (startDate && endDate) {
    q = query(
      transactionsRef(),
      where("createdAt", ">=", Timestamp.fromDate(new Date(startDate))),
      where("createdAt", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59"))),
      orderBy("createdAt", "desc"),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
};

export const subscribeTodayTransactions = (cb: (txs: Transaction[]) => void) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    transactionsRef(),
    where("createdAt", ">=", Timestamp.fromDate(today)),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
  });
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const expensesRef = () => collection(db, "expenses");

export const getExpenses = async (startDate?: string, endDate?: string): Promise<Expense[]> => {
  let q = query(expensesRef(), orderBy("date", "desc"), limit(100));
  if (startDate && endDate) {
    q = query(
      expensesRef(),
      where("date", ">=", Timestamp.fromDate(new Date(startDate))),
      where("date", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59"))),
      orderBy("date", "desc"),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
};

export const addExpense = async (data: Omit<Expense, "id">) => {
  return addDoc(expensesRef(), { ...data, createdAt: serverTimestamp() });
};

export const updateExpense = async (id: string, data: Partial<Expense>) => updateDoc(doc(db, "expenses", id), data);
export const deleteExpense = async (id: string) => deleteDoc(doc(db, "expenses", id));

// ─── STOCKS ───────────────────────────────────────────────────────────────────
export const stocksRef = () => collection(db, "stocks");

export const getStocks = async (): Promise<StockItem[]> => {
  const snap = await getDocs(query(stocksRef(), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockItem));
};

export const subscribeStocks = (cb: (items: StockItem[]) => void) => {
  return onSnapshot(query(stocksRef(), orderBy("name")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockItem)));
  });
};

export const addStock = async (data: Omit<StockItem, "id">) => addDoc(stocksRef(), { ...data, updatedAt: serverTimestamp() });
export const updateStock = async (id: string, data: Partial<StockItem>) => updateDoc(doc(db, "stocks", id), { ...data, updatedAt: serverTimestamp() });
export const deleteStock = async (id: string) => deleteDoc(doc(db, "stocks", id));

// ─── USERS ────────────────────────────────────────────────────────────────────
export const usersRef = () => collection(db, "users");

export const getUsers = async (): Promise<AppUser[]> => {
  const snap = await getDocs(usersRef());
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
};

export const updateUser = async (uid: string, data: Partial<AppUser>) => updateDoc(doc(db, "users", uid), data);

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayTxSnap, monthTxSnap, todayExpSnap, monthExpSnap] = await Promise.all([
    getDocs(query(transactionsRef(), where("createdAt", ">=", Timestamp.fromDate(today)))),
    getDocs(query(transactionsRef(), where("createdAt", ">=", Timestamp.fromDate(monthStart)))),
    getDocs(query(expensesRef(), where("date", ">=", Timestamp.fromDate(today)))),
    getDocs(query(expensesRef(), where("date", ">=", Timestamp.fromDate(monthStart)))),
  ]);

  const sum = (snap: QuerySnapshot<DocumentData>, field: string) =>
    snap.docs.reduce((acc, d) => acc + (d.data()[field] || 0), 0);

  return {
    todayIncome: sum(todayTxSnap, "total"),
    todayExpense: sum(todayExpSnap, "amount"),
    monthIncome: sum(monthTxSnap, "total"),
    monthExpense: sum(monthExpSnap, "amount"),
    transactionCount: todayTxSnap.size,
  };
};
