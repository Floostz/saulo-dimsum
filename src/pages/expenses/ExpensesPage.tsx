// src/pages/expenses/ExpensesPage.tsx
import { createSignal, createMemo, createResource, For, Show } from "solid-js";
import styles from "./ExpensesPage.module.css";
import Button from "../../components/ui/Button";
import { Input, Select, Badge } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { toast } from "../../components/ui/Toast";
import { Expense } from "../../types";
import { getExpenses, addExpense, updateExpense, deleteExpense } from "../../lib/firestore";
import { formatCurrency, formatDate, getToday } from "../../utils";

const CATEGORIES = ["Bahan Baku", "Operasional", "Gaji Karyawan", "Sewa Tempat",
  "Utilitas (Listrik/Air)", "Peralatan", "Kemasan", "Lain-lain"];

const emptyForm = () => ({
  description: "", category: "", amount: 0, supplier: "", date: getToday(),
});

const catColor: Record<string, "default"|"warning"|"danger"|"info"|"success"|"gold"> = {
  "Bahan Baku": "warning", "Gaji Karyawan": "info",
  "Utilitas (Listrik/Air)": "gold", "Sewa Tempat": "danger",
  "Kemasan": "success",
};

export default function ExpensesPage() {
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");

  const [expenses, { refetch }] = createResource(
    () => ({ start: startDate(), end: endDate() }),
    async ({ start, end }) => {
      try { return await getExpenses(start || undefined, end || undefined); }
      catch { return []; }
    }
  );

  const [search, setSearch] = createSignal("");
  const [filterCat, setFilterCat] = createSignal("");
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal(emptyForm());
  const [saving, setSaving] = createSignal(false);
  const [showDelete, setShowDelete] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const list = createMemo(() =>
    (expenses() ?? []).filter((e) => {
      const ms = e.description.toLowerCase().includes(search().toLowerCase()) ||
        (e.supplier ?? "").toLowerCase().includes(search().toLowerCase());
      const mc = !filterCat() || e.category === filterCat();
      return ms && mc;
    })
  );

  const total = createMemo(() => list().reduce((s, e) => s + e.amount, 0));

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setShowModal(true); };

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    const d = e.date instanceof Date ? e.date : (e.date as any).toDate?.() ?? new Date(e.date as any);
    setForm({ description: e.description, category: e.category, amount: e.amount,
      supplier: e.supplier ?? "", date: d.toISOString().split("T")[0] });
    setShowModal(true);
  };

  const handleSave = async () => {
    const f = form();
    if (!f.description.trim()) { toast.error("Deskripsi wajib diisi"); return; }
    if (!f.category) { toast.error("Kategori wajib dipilih"); return; }
    if (f.amount <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    setSaving(true);
    try {
      const data: Omit<Expense, "id"> = {
        description: f.description, category: f.category, amount: f.amount,
        supplier: f.supplier || undefined, date: new Date(f.date),
        createdBy: "admin", createdAt: new Date(),
      };
      if (editingId()) {
        await updateExpense(editingId()!, data);
        toast.success("Pengeluaran diperbarui");
      } else {
        await addExpense(data);
        toast.success("Pengeluaran ditambahkan");
      }
      setShowModal(false);
      refetch();
    } catch { toast.error("Gagal menyimpan", "Periksa koneksi Firebase Anda"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteExpense(id);
      toast.success("Pengeluaran dihapus");
      setShowDelete(null);
      refetch();
    } catch { toast.error("Gagal menghapus"); }
    finally { setDeleting(false); }
  };

  return (
    <div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Pengeluaran</h1>
          <p class={styles.subtitle}>
            <Show when={!expenses.loading}>
              {list().length} catatan — Total: <strong style={{ color: "var(--color-danger)" }}>{formatCurrency(total())}</strong>
            </Show>
            <Show when={expenses.loading}>Memuat...</Show>
          </p>
        </div>
        <Button onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Filters */}
      <div class={styles.filterRow}>
        <Input placeholder="Cari pengeluaran atau supplier..." value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)} class={styles.searchBox}
          leftIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>} />
        <Select options={[{ value: "", label: "Semua Kategori" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          value={filterCat()} onChange={(e) => setFilterCat(e.currentTarget.value)} class={styles.filterSelect} />
        <Input type="date" label="" placeholder="Dari tanggal" value={startDate()}
          onInput={(e) => setStartDate(e.currentTarget.value)} class={styles.dateInput} />
        <Input type="date" label="" placeholder="Sampai" value={endDate()}
          onInput={(e) => setEndDate(e.currentTarget.value)} class={styles.dateInput} />
        <Show when={startDate() || endDate()}>
          <Button variant="secondary" size="md" onClick={() => { setStartDate(""); setEndDate(""); }}>Reset</Button>
        </Show>
      </div>

      <div class={styles.tableWrap}>
        <Show when={expenses.loading}>
          <div class={styles.loadingState}><div class={styles.loadingSpinner} /><span>Memuat data...</span></div>
        </Show>
        <Show when={!expenses.loading}>
          <table class={styles.table}>
            <thead><tr>
              <th>Tanggal</th><th>Deskripsi</th><th>Kategori</th>
              <th>Supplier</th><th>Jumlah</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              <Show when={list().length === 0}>
                <tr><td colspan="6" class={styles.emptyCell}>
                  <div class={styles.emptyState}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
                      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <p>Belum ada pengeluaran</p>
                    <span>Klik "Tambah Pengeluaran" untuk mencatat pengeluaran pertama</span>
                    <Button size="sm" onClick={openAdd}>Tambah Pengeluaran</Button>
                  </div>
                </td></tr>
              </Show>
              <For each={list()}>
                {(exp) => (
                  <tr class={styles.row}>
                    <td class={styles.dateCell}>{formatDate(exp.date)}</td>
                    <td><span class={styles.descCell}>{exp.description}</span></td>
                    <td><Badge variant={catColor[exp.category] ?? "default"} size="sm">{exp.category}</Badge></td>
                    <td class={styles.supplierCell}>{exp.supplier ?? "—"}</td>
                    <td class={styles.amountCell}>{formatCurrency(exp.amount)}</td>
                    <td>
                      <div class={styles.actions}>
                        <button class={styles.actionBtn} onClick={() => openEdit(exp)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class={[styles.actionBtn, styles.actionDelete].join(" ")} onClick={() => setShowDelete(exp.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
            <Show when={list().length > 0}>
              <tfoot>
                <tr class={styles.footerRow}>
                  <td colspan="4" class={styles.footerLabel}>Total Pengeluaran ({list().length} item)</td>
                  <td class={styles.footerTotal}>{formatCurrency(total())}</td>
                  <td />
                </tr>
              </tfoot>
            </Show>
          </table>
        </Show>
      </div>

      <Modal open={showModal()} onClose={() => setShowModal(false)}
        title={editingId() ? "Edit Pengeluaran" : "Tambah Pengeluaran"} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button><Button loading={saving()} onClick={handleSave}>{editingId() ? "Simpan" : "Tambah"}</Button></>}>
        <div class={styles.formGrid}>
          <Input label="Deskripsi" placeholder="cth. Pembelian tepung terigu" value={form().description}
            onInput={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))} class={styles.colSpan2} />
          <Select label="Kategori" options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Pilih kategori" value={form().category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.currentTarget.value }))} />
          <Input label="Jumlah (Rp)" type="number" placeholder="0" value={form().amount || ""}
            onInput={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.currentTarget.value) || 0 }))} />
          <Input label="Supplier (opsional)" placeholder="Nama supplier" value={form().supplier}
            onInput={(e) => setForm((f) => ({ ...f, supplier: e.currentTarget.value }))} />
          <Input label="Tanggal" type="date" value={form().date}
            onInput={(e) => setForm((f) => ({ ...f, date: e.currentTarget.value }))} />
        </div>
      </Modal>

      <Modal open={!!showDelete()} onClose={() => setShowDelete(null)} title="Hapus Pengeluaran" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowDelete(null)}>Batal</Button><Button variant="danger" loading={deleting()} onClick={() => handleDelete(showDelete()!)}>Hapus</Button></>}>
        <p style={{ "font-size": "14px", color: "var(--color-text-secondary)", "line-height": "1.6" }}>
          Yakin ingin menghapus catatan pengeluaran ini?
        </p>
      </Modal>
    </div>
  );
}
