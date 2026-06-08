// src/pages/dashboard/DashboardPage.tsx
import { createSignal, createResource, createMemo, For, Show } from "solid-js";
import styles from "./DashboardPage.module.css";
import { StatCard } from "../../components/ui/Card";
import { formatCurrency } from "../../utils";
import { getDashboardStats } from "../../lib/firestore";
import { subscribeStocks } from "../../lib/firestore";
import { StockItem } from "../../types";

function Skeleton(props: { h?: string; w?: string }) {
  return (
    <div class="skeleton" style={{
      height: props.h ?? "20px",
      width: props.w ?? "100%",
      "border-radius": "6px",
    }} />
  );
}

export default function DashboardPage() {
  const [stats, { refetch }] = createResource(async () => {
    try { return await getDashboardStats(); }
    catch { return null; }
  });

  const [stocks, setStocks] = createSignal<StockItem[]>([]);
  subscribeStocks((items) => setStocks(items));

  const lowStock = createMemo(() =>
    stocks().filter((s) => s.currentStock <= s.minStock)
  );

  const todayProfit = createMemo(() =>
    (stats()?.todayIncome ?? 0) - (stats()?.todayExpense ?? 0)
  );
  const monthProfit = createMemo(() =>
    (stats()?.monthIncome ?? 0) - (stats()?.monthExpense ?? 0)
  );

  return (
    <div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Dashboard</h1>
          <p class={styles.subtitle}>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <button class={styles.refreshBtn} onClick={() => refetch()} title="Refresh data">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      {/* Stat Cards */}
      <div class={styles.statsGrid}>
        <Show when={stats.loading}>
          {[1,2,3,4].map(() => (
            <div class={styles.skeletonCard}>
              <Skeleton h="12px" w="60%" />
              <Skeleton h="28px" w="80%" />
              <Skeleton h="12px" w="40%" />
            </div>
          ))}
        </Show>
        <Show when={!stats.loading}>
          <StatCard
            label="Pemasukan Hari Ini"
            value={formatCurrency(stats()?.todayIncome ?? 0)}
            subValue={`${stats()?.transactionCount ?? 0} transaksi`}
            color="primary"
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
          <StatCard
            label="Pengeluaran Hari Ini"
            value={formatCurrency(stats()?.todayExpense ?? 0)}
            color="warning"
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          />
          <StatCard
            label="Laba Hari Ini"
            value={formatCurrency(todayProfit())}
            color={todayProfit() >= 0 ? "success" : "warning"}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          />
          <StatCard
            label="Laba Bulan Ini"
            value={formatCurrency(monthProfit())}
            subValue={`Pendapatan ${formatCurrency(stats()?.monthIncome ?? 0)}`}
            color="gold"
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>}
          />
        </Show>
      </div>

      <div class={styles.bottomRow}>
        {/* Low Stock */}
        <div class={styles.alertCard}>
          <div class={styles.cardHeader}>
            <div>
              <h3 class={styles.cardTitle}>Stok Hampir Habis</h3>
              <p class={styles.cardSubtitle}>
                <Show when={lowStock().length > 0}>{lowStock().length} item perlu restock</Show>
                <Show when={lowStock().length === 0}>Semua stok aman</Show>
              </p>
            </div>
            <Show when={lowStock().length > 0}>
              <span class={styles.alertBadge}>{lowStock().length} item</span>
            </Show>
          </div>

          <Show when={lowStock().length === 0}>
            <div class={styles.allSafe}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Semua bahan stoknya mencukupi</span>
            </div>
          </Show>

          <Show when={lowStock().length > 0}>
            <div class={styles.stockList}>
              <For each={lowStock().slice(0, 6)}>
                {(item) => (
                  <div class={styles.stockRow}>
                    <div class={styles.stockInfo}>
                      <span class={styles.stockName}>{item.name}</span>
                      <span class={styles.stockUnit}>Min: {item.minStock} {item.unit}</span>
                    </div>
                    <div class={[
                      styles.stockBadge,
                      item.currentStock === 0 ? styles.stockEmpty : styles.stockLow,
                    ].join(" ")}>
                      {item.currentStock} {item.unit}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Monthly Summary */}
        <div class={styles.summaryCard}>
          <div class={styles.cardHeader}>
            <div>
              <h3 class={styles.cardTitle}>Ringkasan Bulan Ini</h3>
              <p class={styles.cardSubtitle}>
                {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div class={styles.summaryList}>
            <Show when={stats.loading}>
              {[1,2,3,4].map(() => (
                <div class={styles.summaryRow}>
                  <Skeleton h="14px" w="50%" />
                  <Skeleton h="18px" w="35%" />
                </div>
              ))}
            </Show>
            <Show when={!stats.loading}>
              {[
                { label: "Total Pendapatan",  value: formatCurrency(stats()?.monthIncome ?? 0),  color: "success" },
                { label: "Total Pengeluaran", value: formatCurrency(stats()?.monthExpense ?? 0), color: "danger" },
                { label: "Laba Bersih",       value: formatCurrency(monthProfit()),               color: "primary" },
                {
                  label: "Margin Laba",
                  value: (stats()?.monthIncome ?? 0) > 0
                    ? `${(monthProfit() / (stats()!.monthIncome) * 100).toFixed(1)}%`
                    : "—",
                  color: "gold",
                },
              ].map((s) => (
                <div class={styles.summaryRow}>
                  <span class={styles.summaryLabel}>{s.label}</span>
                  <span class={[styles.summaryValue, styles[`val-${s.color}`]].join(" ")}>{s.value}</span>
                </div>
              ))}
            </Show>
          </div>
        </div>

        {/* Quick nav */}
        <div class={styles.quickNav}>
          <div class={styles.cardHeader}>
            <h3 class={styles.cardTitle}>Akses Cepat</h3>
          </div>
          <div class={styles.quickNavGrid}>
            {[
              { href: "/pos",      label: "Buka Kasir",       icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
              { href: "/products", label: "Tambah Produk",    icon: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z" },
              { href: "/expenses", label: "Catat Pengeluaran",icon: "M1 4h22M1 4v16a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V4M1 10h22" },
              { href: "/stocks",   label: "Cek Stok",         icon: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
              { href: "/reports",  label: "Export Laporan",   icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" },
              { href: "/finance",  label: "Lihat Keuangan",   icon: "M23 6l-13.5 9.5L4 10.5 1 18M17 6h6v6" },
            ].map((item) => (
              <a href={item.href} class={styles.quickNavItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
