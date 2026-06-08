// src/lib/firestore.ts
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit, onSnapshot, Timestamp, writeBatch, serverTimestamp, } from "firebase/firestore";
import { db } from "./firebase";
// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsRef = () => collection(db, "products");
export const getProducts = async () => {
    const q = query(productsRef(), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const addProduct = async (data) => {
    return addDoc(productsRef(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
};
export const updateProduct = async (id, data) => {
    return updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
};
export const deleteProduct = async (id) => deleteDoc(doc(db, "products", id));
export const subscribeProducts = (cb) => {
    return onSnapshot(query(productsRef(), where("isActive", "==", true), orderBy("name")), (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
};
// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export const transactionsRef = () => collection(db, "transactions");
export const addTransaction = async (data) => {
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
export const getTransactions = async (startDate, endDate) => {
    let q = query(transactionsRef(), orderBy("createdAt", "desc"), limit(100));
    if (startDate && endDate) {
        q = query(transactionsRef(), where("createdAt", ">=", Timestamp.fromDate(new Date(startDate))), where("createdAt", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59"))), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const subscribeTodayTransactions = (cb) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(transactionsRef(), where("createdAt", ">=", Timestamp.fromDate(today)), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
};
// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const expensesRef = () => collection(db, "expenses");
export const getExpenses = async (startDate, endDate) => {
    let q = query(expensesRef(), orderBy("date", "desc"), limit(100));
    if (startDate && endDate) {
        q = query(expensesRef(), where("date", ">=", Timestamp.fromDate(new Date(startDate))), where("date", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59"))), orderBy("date", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const addExpense = async (data) => {
    return addDoc(expensesRef(), { ...data, createdAt: serverTimestamp() });
};
export const updateExpense = async (id, data) => updateDoc(doc(db, "expenses", id), data);
export const deleteExpense = async (id) => deleteDoc(doc(db, "expenses", id));
// ─── STOCKS ───────────────────────────────────────────────────────────────────
export const stocksRef = () => collection(db, "stocks");
export const getStocks = async () => {
    const snap = await getDocs(query(stocksRef(), orderBy("name")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const subscribeStocks = (cb) => {
    return onSnapshot(query(stocksRef(), orderBy("name")), (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
};
export const addStock = async (data) => addDoc(stocksRef(), { ...data, updatedAt: serverTimestamp() });
export const updateStock = async (id, data) => updateDoc(doc(db, "stocks", id), { ...data, updatedAt: serverTimestamp() });
export const deleteStock = async (id) => deleteDoc(doc(db, "stocks", id));
// ─── USERS ────────────────────────────────────────────────────────────────────
export const usersRef = () => collection(db, "users");
export const getUsers = async () => {
    const snap = await getDocs(usersRef());
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
};
export const updateUser = async (uid, data) => updateDoc(doc(db, "users", uid), data);
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
    const sum = (snap, field) => snap.docs.reduce((acc, d) => acc + (d.data()[field] || 0), 0);
    return {
        todayIncome: sum(todayTxSnap, "total"),
        todayExpense: sum(todayExpSnap, "amount"),
        monthIncome: sum(monthTxSnap, "total"),
        monthExpense: sum(monthExpSnap, "amount"),
        transactionCount: todayTxSnap.size,
    };
};
