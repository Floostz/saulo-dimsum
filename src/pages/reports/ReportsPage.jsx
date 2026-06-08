// src/pages/reports/ReportsPage.tsx
import { createSignal, createResource, createMemo, For, Show } from "solid-js";
import styles from "./ReportsPage.module.css";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatCurrency, formatDate, getToday, getStartOfMonth } from "../../utils";
import { exportFinancialReport, exportTransactionsToExcel, exportExpensesToExcel, } from "../../utils/exportExcel";
import { getTransactions, getExpenses } from "../../lib/firestore";
import { toast } from "../../components/ui/Toast";
export default function ReportsPage() {
    const [reportType, setReportType] = createSignal("monthly");
    const [startDate, setStartDate] = createSignal(getStartOfMonth());
    const [endDate, setEndDate] = createSignal(getToday());
    const [exporting, setExporting] = createSignal(false);
    const [data, { refetch }] = createResource(() => ({ start: startDate(), end: endDate() }), async ({ start, end }) => {
        try {
            const [txs, exps] = await Promise.all([
                getTransactions(start, end),
                getExpenses(start, end),
            ]);
            return { txs, exps };
        }
        catch {
            return { txs: [], exps: [] };
        }
    });
    const txs = createMemo(() => data()?.txs ?? []);
    const exps = createMemo(() => data()?.exps ?? []);
    const totalIncome = createMemo(() => txs().reduce((s, t) => s + t.total, 0));
    const totalExpense = createMemo(() => exps().reduce((s, e) => s + e.amount, 0));
    const profit = createMemo(() => totalIncome() - totalExpense());
    const payBreakdown = createMemo(() => {
        const m = { cash: 0, qris: 0, transfer: 0 };
        txs().forEach((t) => { m[t.paymentMethod] = (m[t.paymentMethod] ?? 0) + t.total; });
        return Object.entries(m).filter(([, v]) => v > 0).map(([method, total]) => ({ method, total }));
    });
    const setPreset = (type) => {
        setReportType(type);
        const now = new Date();
        const fmt = (d) => d.toISOString().split("T")[0];
        if (type === "daily") {
            const t = fmt(now);
            setStartDate(t);
            setEndDate(t);
        }
        else if (type === "monthly") {
            setStartDate(fmt(new Date(now.getFullYear(), now.getMonth(), 1)));
            setEndDate(fmt(now));
        }
        else if (type === "yearly") {
            setStartDate(fmt(new Date(now.getFullYear(), 0, 1)));
            setEndDate(fmt(now));
        }
    };
    const handleExportFull = async () => {
        if (txs().length === 0 && exps().length === 0) {
            toast.warning("Tidak ada data", "Tidak ada transaksi atau pengeluaran untuk diekspor");
            return;
        }
        setExporting(true);
        try {
            const period = `${startDate()}-sampai-${endDate()}`;
            exportFinancialReport(txs(), exps(), period);
            toast.success("Laporan diekspor", "File Excel berhasil diunduh");
        }
        catch {
            toast.error("Gagal ekspor");
        }
        finally {
            setExporting(false);
        }
    };
    const handleExportTx = () => {
        if (txs().length === 0) {
            toast.warning("Tidak ada transaksi");
            return;
        }
        exportTransactionsToExcel(txs(), "laporan-transaksi");
        toast.success("Transaksi diekspor");
    };
    const handleExportExp = () => {
        if (exps().length === 0) {
            toast.warning("Tidak ada pengeluaran");
            return;
        }
        exportExpensesToExcel(exps(), "laporan-pengeluaran");
        toast.success("Pengeluaran diekspor");
    };
    return (<div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Laporan</h1>
          <p class={styles.subtitle}>Generate dan ekspor laporan keuangan ke Excel</p>
        </div>
        <Button onClick={handleExportFull} loading={exporting()} variant="gold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Excel Lengkap
        </Button>
      </div>

      {/* Period selector */}
      <div class={styles.periodCard}>
        <div class={styles.presets}>
          {["daily", "monthly", "yearly", "custom"].map((t) => (<button class={[styles.presetBtn, reportType() === t && styles.presetActive].filter(Boolean).join(" ")} onClick={() => setPreset(t)}>
              {t === "daily" ? "Harian" : t === "monthly" ? "Bulanan" : t === "yearly" ? "Tahunan" : "Custom"}
            </button>))}
        </div>
        <div class={styles.dateRange}>
          <Input label="Dari" type="date" value={startDate()} onInput={(e) => { setReportType("custom"); setStartDate(e.currentTarget.value); }}/>
          <span class={styles.dateSep}>—</span>
          <Input label="Sampai" type="date" value={endDate()} onInput={(e) => { setReportType("custom"); setEndDate(e.currentTarget.value); }}/>
          <Button variant="secondary" size="md" class={styles.applyBtn} onClick={() => refetch()}>Tampilkan</Button>
        </div>
      </div>

      {/* Summary */}
      <div class={styles.summaryGrid}>
        {[
            { label: "Total Pemasukan", value: formatCurrency(totalIncome()), color: "var(--color-success)", bg: "var(--color-success-bg)", icon: "M23 6 13.5 15.5 8.5 10.5 1 18M17 6h6v6" },
            { label: "Total Pengeluaran", value: formatCurrency(totalExpense()), color: "var(--color-danger)", bg: "var(--color-danger-bg)", icon: "M23 18 13.5 8.5 8.5 13.5 1 6M17 18h6v-6" },
            { label: "Laba Bersih", value: formatCurrency(profit()), color: "var(--color-primary)", bg: "var(--color-primary-muted)", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
            { label: "Jumlah Transaksi", value: String(txs().length), color: "var(--color-gold)", bg: "var(--color-gold-light)", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
        ].map((s) => (<div class={styles.summaryCard}>
            <div class={styles.summaryIcon} style={{ background: s.bg, color: s.color }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d={s.icon}/>
              </svg>
            </div>
            <div class={styles.summaryInfo}>
              <span class={styles.summaryLabel}>{s.label}</span>
              <span class={styles.summaryValue} style={{ color: s.color }}>
                <Show when={data.loading}><span class="skeleton" style={{ width: "80px", height: "20px", display: "inline-block" }}/></Show>
                <Show when={!data.loading}>{s.value}</Show>
              </span>
            </div>
          </div>))}
      </div>

      <div class={styles.contentRow}>
        {/* Transactions table */}
        <div class={styles.tableCard}>
          <div class={styles.tableHeader}>
            <div>
              <h3 class={styles.tableTitle}>Detail Transaksi</h3>
              <p class={styles.tableSub}>
                <Show when={data.loading}>Memuat...</Show>
                <Show when={!data.loading}>{txs().length} transaksi</Show>
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportTx}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </Button>
          </div>

          <Show when={data.loading}>
            <div class={styles.loadingState}><div class={styles.loadingSpinner}/><span>Memuat dari Firebase...</span></div>
          </Show>

          <Show when={!data.loading && txs().length === 0}>
            <div class={styles.emptyState}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Belum ada transaksi</p>
              <span>Tidak ada transaksi pada periode yang dipilih</span>
            </div>
          </Show>

          <Show when={!data.loading && txs().length > 0}>
            <div class={styles.tableWrap}>
              <table class={styles.table}>
                <thead>
                  <tr>
                    <th>No. Transaksi</th><th>Tanggal</th><th>Kasir</th><th>Metode</th><th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={txs().slice(0, 50)}>
                    {(tx) => (<tr class={styles.row}>
                        <td class={styles.txCode}>{tx.transactionNumber}</td>
                        <td class={styles.dateCell}>{formatDate(tx.createdAt)}</td>
                        <td class={styles.cashierCell}>{tx.cashierName}</td>
                        <td>
                          <span class={[styles.methodPill, styles[`method-${tx.paymentMethod}`]].join(" ")}>
                            {tx.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td class={styles.totalCell}>{formatCurrency(tx.total)}</td>
                      </tr>)}
                  </For>
                </tbody>
              </table>
              <Show when={txs().length > 50}>
                <div class={styles.moreNote}>Menampilkan 50 dari {txs().length} transaksi. Export Excel untuk data lengkap.</div>
              </Show>
            </div>
          </Show>
        </div>

        {/* Side panel */}
        <div class={styles.sidePanel}>
          {/* Payment breakdown */}
          <div class={styles.breakdownCard}>
            <h3 class={styles.tableTitle}>Metode Pembayaran</h3>
            <Show when={payBreakdown().length === 0}>
              <p style={{ "font-size": "13px", color: "var(--color-text-muted)", "margin-top": "12px" }}>Belum ada data</p>
            </Show>
            <div class={styles.breakdownList}>
              <For each={payBreakdown()}>
                {(item) => (<div class={styles.breakdownRow}>
                    <div class={styles.breakdownInfo}>
                      <span class={[styles.methodDot, styles[`dot-${item.method}`]].join(" ")}/>
                      <span>{item.method.toUpperCase()}</span>
                    </div>
                    <div class={styles.breakdownBar}>
                      <div class={styles.breakdownFill} style={{
                width: `${(item.total / totalIncome()) * 100}%`,
                background: item.method === "cash" ? "var(--color-primary)"
                    : item.method === "qris" ? "var(--color-info)" : "var(--color-gold)",
            }}/>
                    </div>
                    <span class={styles.breakdownVal}>{formatCurrency(item.total)}</span>
                  </div>)}
              </For>
            </div>
          </div>

          {/* Export buttons */}
          <div class={styles.exportCard}>
            <h3 class={styles.tableTitle}>Ekspor Laporan</h3>
            <div class={styles.exportList}>
              {[
            { label: "Laporan Lengkap", desc: "Transaksi + Pengeluaran + Ringkasan", fn: handleExportFull, icon: "M3 3h18v18H3zM3 9h18M9 21V9" },
            { label: "Data Transaksi", desc: "Semua transaksi penjualan", fn: handleExportTx, icon: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" },
            { label: "Data Pengeluaran", desc: "Semua catatan pengeluaran", fn: handleExportExp, icon: "M1 4h22M1 4v16a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V4M1 10h22" },
        ].map((item) => (<button class={styles.exportItem} onClick={item.fn}>
                  <div class={styles.exportIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d={item.icon}/>
                    </svg>
                  </div>
                  <div class={styles.exportInfo}>
                    <span class={styles.exportLabel}>{item.label}</span>
                    <span class={styles.exportDesc}>{item.desc}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>))}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
