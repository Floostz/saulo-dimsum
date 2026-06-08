// src/utils/exportExcel.ts
import * as XLSX from "xlsx";
import { Transaction, Expense } from "../types";
import { formatCurrency, formatDateTime } from "./index";

export const exportTransactionsToExcel = (
  transactions: Transaction[],
  filename = "laporan-transaksi"
) => {
  const data = transactions.map((tx) => ({
    "No. Transaksi": tx.transactionNumber,
    "Tanggal": formatDateTime(tx.createdAt),
    "Kasir": tx.cashierName,
    "Items": tx.items.map((i) => `${i.product.name} x${i.qty}`).join(", "),
    "Subtotal": tx.subtotal,
    "Diskon": tx.totalDiscount,
    "Total": tx.total,
    "Metode Bayar": tx.paymentMethod.toUpperCase(),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  // Column widths
  ws["!cols"] = [
    { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 50 },
    { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportExpensesToExcel = (expenses: Expense[], filename = "laporan-pengeluaran") => {
  const data = expenses.map((e) => ({
    "Tanggal": formatDateTime(e.date),
    "Deskripsi": e.description,
    "Kategori": e.category,
    "Supplier": e.supplier || "-",
    "Jumlah": e.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  ws["!cols"] = [{ wch: 22 }, { wch: 35 }, { wch: 18 }, { wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportFinancialReport = (
  transactions: Transaction[],
  expenses: Expense[],
  period: string
) => {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const totalIncome = transactions.reduce((s, t) => s + t.total, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const summaryData = [
    { "Keterangan": "Total Pemasukan", "Jumlah": totalIncome },
    { "Keterangan": "Total Pengeluaran", "Jumlah": totalExpense },
    { "Keterangan": "Laba Bersih", "Jumlah": totalIncome - totalExpense },
    { "Keterangan": "Jumlah Transaksi", "Jumlah": transactions.length },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // Transactions sheet
  const txData = transactions.map((tx) => ({
    "No. Transaksi": tx.transactionNumber,
    "Tanggal": formatDateTime(tx.createdAt),
    "Total": tx.total,
    "Metode": tx.paymentMethod,
    "Kasir": tx.cashierName,
  }));
  const wsTx = XLSX.utils.json_to_sheet(txData);
  wsTx["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTx, "Transaksi");

  // Expenses sheet
  const expData = expenses.map((e) => ({
    "Tanggal": formatDateTime(e.date),
    "Deskripsi": e.description,
    "Kategori": e.category,
    "Jumlah": e.amount,
  }));
  const wsExp = XLSX.utils.json_to_sheet(expData);
  wsExp["!cols"] = [{ wch: 22 }, { wch: 35 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsExp, "Pengeluaran");

  XLSX.writeFile(wb, `laporan-keuangan-${period}.xlsx`);
};
