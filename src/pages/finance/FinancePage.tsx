// src/pages/finance/FinancePage.tsx
import { createSignal, createResource, createMemo, For, Show } from "solid-js";
import styles from "./FinancePage.module.css";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatCard } from "../../components/ui/Card";
import { formatCurrency, getToday, getStartOfMonth } from "../../utils";
import { getTransactions, getExpenses } from "../../lib/firestore";
import { Transaction, Expense } from "../../types";

export default function FinancePage() {
  const [startDate, setStartDate] = createSignal(getStartOfMonth());
  const [endDate, setEndDate]     = createSignal(getToday());

  const [data, { refetch }] = createResource(
    () => ({ start: startDate(), end: endDate() }),
    async ({ start, end }) => {
      try {
        const [txs, exps] = await Promise.all([
          getTransactions(start, end),
          getExpenses(start, end),
        ]);
        return { txs, exps };
      } catch { return { txs: [] as Transaction[], exps: [] as Expense[] }; }
    }
  );

  const txs  = createMemo(() => data()?.txs  ?? []);
  const exps = createMemo(() => data()?.exps  ?? []);

  const totalIncome  = createMemo(() => txs().reduce((s, t) => s + t.total, 0));
  const totalExpense = createMemo(() => exps().reduce((s, e) => s + e.amount, 0));
  const netProfit    = createMemo(() => totalIncome() - totalExpense());
  const margin       = createMemo(() =>
    totalIncome() > 0 ? ((netProfit() / totalIncome()) * 100).toFixed(1) : "0"
  );

  // Build combined cash-flow rows sorted desc
  type CashRow = { date: string; type: "income" | "expense"; desc: string; amount: number; balance: number; ref?: string };

  const cashFlow = createMemo((): CashRow[] => {
    const rows: Omit<CashRow, "balance">[] = [
      ...txs().map((t) => ({
        date: t.createdAt instanceof Date ? t.createdAt.toISOString().split("T")[0]
          : (t.createdAt as any)?.toDate?.()?.toISOString().split("T")[0] ?? "",
        type: "income" as const,
        desc: `Penjualan — ${t.transactionNumber}`,
        amount: t.total,
        ref: t.transactionNumber,
      })),
      ...exps().map((e) => ({
        date: e.date instanceof Date ? e.date.toISOString().split("T")[0]
          : (e.date as any)?.toDate?.()?.toISOString().split("T")[0] ?? "",
        type: "expense" as const,
        desc: e.description,
        amount: e.amount,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    let balance = totalIncome() - totalExpense();
    return rows.map((r) => {
      const row: CashRow = { ...r, balance };
      balance -= r.type === "income" ? r.amount : -r.amount;
      return row;
    });
  });

  return (
    <div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Keuangan</h1>
          <p class={styles.subtitle}>Arus kas dan ringkasan keuangan</p>
        </div>
        <button class={styles.refreshBtn} onClick={() => refetch()} title="Refresh">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      {/* Date filter */}
      <div class={styles.filterBar}>
        <Input label="Dari Tanggal" type="date" value={startDate()}
          onInput={(e) => setStartDate(e.currentTarget.value)} class={styles.dateInput} />
        <Input label="Sampai Tanggal" type="date" value={endDate()}
          onInput={(e) => setEndDate(e.currentTarget.value)} class={styles.dateInput} />
        <Button variant="secondary" size="md" class={styles.resetBtn}
          onClick={() => { setStartDate(getStartOfMonth()); setEndDate(getToday()); }}>
          Reset
        </Button>
      </div>

      {/* Summary cards */}
      <div class={styles.statsGrid}>
        <StatCard label="Total Pemasukan" value={formatCurrency(totalIncome())} color="success"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} />
        <StatCard label="Total Pengeluaran" value={formatCurrency(totalExpense())} color="warning"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>} />
        <StatCard label="Laba Bersih" value={formatCurrency(netProfit())} color={netProfit() >= 0 ? "primary" : "warning"}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard label="Margin Laba" value={`${margin()}%`} color="gold"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>} />
      </div>

      {/* Cash-flow table */}
      <div class={styles.cashFlowCard}>
        <div class={styles.tableHeader}>
          <div>
            <h3 class={styles.cardTitle}>Arus Kas</h3>
            <p class={styles.cardSub}>
              <Show when={data.loading}>Memuat data...</Show>
              <Show when={!data.loading}>{cashFlow().length} entri — {startDate()} s/d {endDate()}</Show>
            </p>
          </div>
        </div>

        <Show when={data.loading}>
          <div class={styles.loadingState}>
            <div class={styles.loadingSpinner} />
            <span>Memuat dari Firebase...</span>
          </div>
        </Show>

        <Show when={!data.loading && cashFlow().length === 0}>
          <div class={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            </svg>
            <p>Tidak ada data untuk periode ini</p>
            <span>Coba ubah rentang tanggal atau tambahkan transaksi terlebih dahulu</span>
          </div>
        </Show>

        <Show when={!data.loading && cashFlow().length > 0}>
          <div class={styles.tableWrap}>
            <table class={styles.table}>
              <thead>
                <tr>
                  <th>Tanggal</th><th>Keterangan</th><th>Masuk</th>
                  <th>Keluar</th><th>Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody>
                <For each={cashFlow()}>
                  {(row) => (
                    <tr class={styles.row}>
                      <td class={styles.dateCell}>
                        {new Date(row.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div class={styles.descCell}>
                          <span>{row.desc}</span>
                          <Show when={row.ref}>
                            <span class={styles.refCode}>{row.ref}</span>
                          </Show>
                        </div>
                      </td>
                      <td class={styles.incomeCell}>
                        <Show when={row.type === "income"} fallback={<span class={styles.dash}>—</span>}>
                          {formatCurrency(row.amount)}
                        </Show>
                      </td>
                      <td class={styles.expenseCell}>
                        <Show when={row.type === "expense"} fallback={<span class={styles.dash}>—</span>}>
                          {formatCurrency(row.amount)}
                        </Show>
                      </td>
                      <td class={[styles.balanceCell, row.balance >= 0 ? styles.balancePos : styles.balanceNeg].join(" ")}>
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>
    </div>
  );
}
