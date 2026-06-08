// src/pages/stocks/StocksPage.tsx
import { createSignal, createMemo, createResource, For, Show } from "solid-js";
import styles from "./StocksPage.module.css";
import Button from "../../components/ui/Button";
import { Input, Badge } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { toast } from "../../components/ui/Toast";
import { StockItem } from "../../types";
import { getStocks, addStock, updateStock, deleteStock } from "../../lib/firestore";
import { formatCurrency } from "../../utils";

const emptyForm = () => ({ name: "", unit: "", currentStock: 0, minStock: 0, costPerUnit: 0 });

export default function StocksPage() {
  const [stocks, { refetch }] = createResource<StockItem[]>(async () => {
    try { return await getStocks(); } catch { return []; }
  });

  const [search, setSearch] = createSignal("");
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal(emptyForm());
  const [saving, setSaving] = createSignal(false);
  const [showDelete, setShowDelete] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);
  const [showAdjust, setShowAdjust] = createSignal<StockItem | null>(null);
  const [adjustQty, setAdjustQty] = createSignal(0);
  const [adjustType, setAdjustType] = createSignal<"add" | "subtract">("add");
  const [adjustNote, setAdjustNote] = createSignal("");
  const [adjustSaving, setAdjustSaving] = createSignal(false);

  const list = createMemo(() =>
    (stocks() ?? []).filter((s) => s.name.toLowerCase().includes(search().toLowerCase()))
  );

  const lowCount = createMemo(() => (stocks() ?? []).filter((s) => s.currentStock <= s.minStock).length);

  const status = (s: StockItem) => s.currentStock === 0 ? "empty" : s.currentStock <= s.minStock ? "low" : "ok";

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (s: StockItem) => {
    setEditingId(s.id);
    setForm({ name: s.name, unit: s.unit, currentStock: s.currentStock, minStock: s.minStock, costPerUnit: s.costPerUnit });
    setShowModal(true);
  };

  const handleSave = async () => {
    const f = form();
    if (!f.name.trim()) { toast.error("Nama bahan wajib diisi"); return; }
    if (!f.unit.trim()) { toast.error("Satuan wajib diisi"); return; }
    setSaving(true);
    try {
      if (editingId()) {
        await updateStock(editingId()!, { ...f, updatedAt: new Date() });
        toast.success("Stok diperbarui");
      } else {
        await addStock({ ...f, updatedAt: new Date() });
        toast.success("Item stok ditambahkan");
      }
      setShowModal(false);
      refetch();
    } catch { toast.error("Gagal menyimpan", "Periksa koneksi Firebase Anda"); }
    finally { setSaving(false); }
  };

  const handleAdjust = async () => {
    const item = showAdjust();
    if (!item || adjustQty() <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    setAdjustSaving(true);
    try {
      const newStock = adjustType() === "add"
        ? item.currentStock + adjustQty()
        : Math.max(0, item.currentStock - adjustQty());
      await updateStock(item.id, { currentStock: newStock, updatedAt: new Date() });
      toast.success(`Stok ${item.name} disesuaikan`);
      setShowAdjust(null);
      setAdjustQty(0);
      setAdjustNote("");
      refetch();
    } catch { toast.error("Gagal menyesuaikan stok"); }
    finally { setAdjustSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteStock(id);
      toast.success("Item stok dihapus");
      setShowDelete(null);
      refetch();
    } catch { toast.error("Gagal menghapus"); }
    finally { setDeleting(false); }
  };

  return (
    <div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Stok Bahan</h1>
          <p class={styles.subtitle}>
            <Show when={!stocks.loading}>
              {(stocks() ?? []).length} item
              <Show when={lowCount() > 0}>
                {" — "}<span class={styles.alertText}>{lowCount()} perlu restock</span>
              </Show>
            </Show>
            <Show when={stocks.loading}>Memuat...</Show>
          </p>
        </div>
        <Button onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Item
        </Button>
      </div>

      <Show when={!stocks.loading && lowCount() > 0}>
        <div class={styles.alertBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span><strong>{lowCount()} item</strong> stok di bawah batas minimum. Segera restock.</span>
        </div>
      </Show>

      <Input placeholder="Cari bahan..." value={search()} onInput={(e) => setSearch(e.currentTarget.value)}
        class={styles.searchBox}
        leftIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>} />

      <Show when={stocks.loading}>
        <div class={styles.loadingState}><div class={styles.loadingSpinner} /><span>Memuat data stok...</span></div>
      </Show>

      <Show when={!stocks.loading && list().length === 0}>
        <div class={styles.emptyFull}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <p>{search() ? "Bahan tidak ditemukan" : "Belum ada item stok"}</p>
          <Show when={!search()}>
            <span>Tambahkan bahan baku untuk mulai memantau stok</span>
            <Button size="sm" onClick={openAdd}>Tambah Item Stok</Button>
          </Show>
        </div>
      </Show>

      <Show when={!stocks.loading && list().length > 0}>
        <div class={styles.stockGrid}>
          <For each={list()}>
            {(item) => {
              const s = status(item);
              const pct = Math.min(100, (item.currentStock / Math.max(item.minStock * 2, 1)) * 100);
              return (
                <div class={[styles.stockCard, styles[`status-${s}`]].join(" ")}>
                  <div class={styles.stockCardHeader}>
                    <div class={styles.stockIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                        <line x1="10" y1="12" x2="14" y2="12"/>
                      </svg>
                    </div>
                    <Badge variant={s === "ok" ? "success" : s === "low" ? "warning" : "danger"} size="sm">
                      {s === "ok" ? "Aman" : s === "low" ? "Menipis" : "Habis"}
                    </Badge>
                  </div>
                  <h4 class={styles.stockName}>{item.name}</h4>
                  <div class={styles.stockQty}>
                    <span class={styles.stockQtyNum}>{item.currentStock}</span>
                    <span class={styles.stockQtyUnit}>{item.unit}</span>
                  </div>
                  <div class={styles.stockBar}>
                    <div class={[styles.stockBarFill, styles[`bar-${s}`]].join(" ")} style={{ width: `${pct}%` }} />
                  </div>
                  <div class={styles.stockMeta}>
                    <span>Min: {item.minStock} {item.unit}</span>
                    <span>{formatCurrency(item.costPerUnit)}/{item.unit}</span>
                  </div>
                  <div class={styles.stockActions}>
                    <button class={styles.adjustBtn} onClick={() => { setShowAdjust(item); setAdjustQty(0); setAdjustType("add"); }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Sesuaikan
                    </button>
                    <button class={styles.editBtn} onClick={() => openEdit(item)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class={styles.deleteBtn} onClick={() => setShowDelete(item.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Add/Edit Modal */}
      <Modal open={showModal()} onClose={() => setShowModal(false)}
        title={editingId() ? "Edit Item Stok" : "Tambah Item Stok"} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button><Button loading={saving()} onClick={handleSave}>Simpan</Button></>}>
        <div class={styles.formGrid}>
          <Input label="Nama Bahan" placeholder="cth. Tepung Terigu" value={form().name}
            onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} class={styles.colSpan2} />
          <Input label="Satuan" placeholder="kg, liter, pcs..." value={form().unit}
            onInput={(e) => setForm((f) => ({ ...f, unit: e.currentTarget.value }))} />
          <Input label="Stok Saat Ini" type="number" placeholder="0" value={form().currentStock || ""}
            onInput={(e) => setForm((f) => ({ ...f, currentStock: parseFloat(e.currentTarget.value) || 0 }))} />
          <Input label="Stok Minimum (Alert)" type="number" placeholder="0" value={form().minStock || ""}
            onInput={(e) => setForm((f) => ({ ...f, minStock: parseFloat(e.currentTarget.value) || 0 }))} />
          <Input label="Harga per Satuan (Rp)" type="number" placeholder="0" value={form().costPerUnit || ""}
            onInput={(e) => setForm((f) => ({ ...f, costPerUnit: parseFloat(e.currentTarget.value) || 0 }))} />
        </div>
      </Modal>

      {/* Adjust Modal */}
      <Modal open={!!showAdjust()} onClose={() => setShowAdjust(null)}
        title={`Sesuaikan Stok — ${showAdjust()?.name}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowAdjust(null)}>Batal</Button><Button loading={adjustSaving()} onClick={handleAdjust}>Simpan</Button></>}>
        <div style={{ display: "flex", "flex-direction": "column", gap: "var(--space-4)" }}>
          <div class={styles.currentStockInfo}>
            <span>Stok saat ini</span>
            <strong>{showAdjust()?.currentStock} {showAdjust()?.unit}</strong>
          </div>
          <div class={styles.adjustTypes}>
            <button class={[styles.adjustTypeBtn, adjustType() === "add" && styles.adjustTypeActive].filter(Boolean).join(" ")} onClick={() => setAdjustType("add")}>Tambah Stok</button>
            <button class={[styles.adjustTypeBtn, adjustType() === "subtract" && styles.adjustTypeActive].filter(Boolean).join(" ")} onClick={() => setAdjustType("subtract")}>Kurangi Stok</button>
          </div>
          <Input label={`Jumlah (${showAdjust()?.unit})`} type="number" placeholder="0"
            value={adjustQty() || ""} onInput={(e) => setAdjustQty(parseFloat(e.currentTarget.value) || 0)} />
          <Input label="Keterangan (opsional)" placeholder="Alasan penyesuaian..."
            value={adjustNote()} onInput={(e) => setAdjustNote(e.currentTarget.value)} />
          <Show when={adjustQty() > 0}>
            <div class={styles.adjustPreview}>
              Stok setelah: <strong>
                {adjustType() === "add"
                  ? (showAdjust()?.currentStock ?? 0) + adjustQty()
                  : Math.max(0, (showAdjust()?.currentStock ?? 0) - adjustQty())
                } {showAdjust()?.unit}
              </strong>
            </div>
          </Show>
        </div>
      </Modal>

      <Modal open={!!showDelete()} onClose={() => setShowDelete(null)} title="Hapus Item Stok" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowDelete(null)}>Batal</Button><Button variant="danger" loading={deleting()} onClick={() => handleDelete(showDelete()!)}>Hapus</Button></>}>
        <p style={{ "font-size": "14px", color: "var(--color-text-secondary)", "line-height": "1.6" }}>Yakin ingin menghapus item stok ini?</p>
      </Modal>
    </div>
  );
}
