// src/pages/products/ProductsPage.tsx
import { createSignal, createMemo, createResource, For, Show } from "solid-js";
import styles from "./ProductsPage.module.css";
import Button from "../../components/ui/Button";
import { Input, Select, Badge } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { toast } from "../../components/ui/Toast";
import { Product } from "../../types";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../../lib/firestore";
import { formatCurrency } from "../../utils";

const CATEGORIES = ["Dimsum", "Siomay", "Hakau", "Cheong Fun", "Goreng", "Minuman", "Paket", "Lainnya"];
const UNITS = ["porsi", "pcs", "box", "cup", "paket", "loyang"];

const emptyForm = (): Omit<Product, "id" | "createdAt" | "updatedAt"> => ({
  name: "", category: "", price: 0, costPrice: 0, stock: 0, unit: "porsi", isActive: true,
});

export default function ProductsPage() {
  const [products, { refetch }] = createResource<Product[]>(async () => {
    try { return await getProducts(); } catch { return []; }
  });

  const [search, setSearch] = createSignal("");
  const [filterCat, setFilterCat] = createSignal("");
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [form, setForm] = createSignal(emptyForm());
  const [saving, setSaving] = createSignal(false);
  const [showDelete, setShowDelete] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const list = createMemo(() =>
    (products() ?? []).filter((p) => {
      const ms = p.name.toLowerCase().includes(search().toLowerCase());
      const mc = !filterCat() || p.category === filterCat();
      return ms && mc;
    })
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setShowModal(true); };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, category: p.category, price: p.price, costPrice: p.costPrice, stock: p.stock, unit: p.unit, isActive: p.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    const f = form();
    if (!f.name.trim()) { toast.error("Nama produk wajib diisi"); return; }
    if (!f.category) { toast.error("Kategori wajib dipilih"); return; }
    if (f.price <= 0) { toast.error("Harga jual harus lebih dari 0"); return; }
    setSaving(true);
    try {
      if (editingId()) {
        await updateProduct(editingId()!, f);
        toast.success("Produk diperbarui");
      } else {
        await addProduct({ ...f, createdAt: new Date(), updatedAt: new Date() });
        toast.success("Produk ditambahkan");
      }
      setShowModal(false);
      refetch();
    } catch (e) {
      toast.error("Gagal menyimpan", "Periksa koneksi Firebase Anda");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast.success("Produk dihapus");
      setShowDelete(null);
      refetch();
    } catch { toast.error("Gagal menghapus"); }
    finally { setDeleting(false); }
  };

  const margin = (p: Product) =>
    p.price > 0 ? ((p.price - p.costPrice) / p.price * 100).toFixed(0) + "%" : "—";

  return (
    <div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Manajemen Produk</h1>
          <p class={styles.subtitle}>
            <Show when={products.loading}>Memuat...</Show>
            <Show when={!products.loading}>{(products() ?? []).length} produk</Show>
          </p>
        </div>
        <Button onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Produk
        </Button>
      </div>

      <div class={styles.filters}>
        <Input placeholder="Cari produk..." value={search()} onInput={(e) => setSearch(e.currentTarget.value)}
          leftIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
          class={styles.searchBox} />
        <Select options={[{ value: "", label: "Semua Kategori" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          value={filterCat()} onChange={(e) => setFilterCat(e.currentTarget.value)} class={styles.filterSelect} />
      </div>

      <div class={styles.tableWrap}>
        <Show when={products.loading}>
          <div class={styles.loadingState}>
            <div class={styles.loadingSpinner} />
            <span>Memuat data dari Firebase...</span>
          </div>
        </Show>

        <Show when={!products.loading}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Produk</th><th>Kategori</th><th>Harga Jual</th>
                <th>Harga Modal</th><th>Margin</th><th>Stok</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <Show when={list().length === 0}>
                <tr><td colspan="8" class={styles.emptyCell}>
                  <div class={styles.emptyState}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
                      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    <p>Belum ada produk</p>
                    <span>Klik "Tambah Produk" untuk menambahkan produk pertama</span>
                    <Button size="sm" onClick={openAdd}>Tambah Produk</Button>
                  </div>
                </td></tr>
              </Show>
              <For each={list()}>
                {(p) => (
                  <tr class={styles.row}>
                    <td>
                      <div class={styles.productCell}>
                        <div class={styles.productThumb}>{p.name[0]?.toUpperCase()}</div>
                        <div>
                          <div class={styles.productCellName}>{p.name}</div>
                          <div class={styles.productCellUnit}>{p.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge variant="default" size="sm">{p.category}</Badge></td>
                    <td><span class={styles.priceCell}>{formatCurrency(p.price)}</span></td>
                    <td><span class={styles.costCell}>{formatCurrency(p.costPrice)}</span></td>
                    <td>
                      <Badge variant={parseInt(margin(p)) >= 40 ? "success" : parseInt(margin(p)) >= 20 ? "warning" : "danger"} size="sm">
                        {margin(p)}
                      </Badge>
                    </td>
                    <td>
                      <span class={[styles.stockVal, p.stock <= 5 && p.stock > 0 ? styles.stockLow : "", p.stock === 0 ? styles.stockEmpty : ""].filter(Boolean).join(" ")}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td><Badge variant={p.isActive ? "success" : "default"} size="sm">{p.isActive ? "Aktif" : "Nonaktif"}</Badge></td>
                    <td>
                      <div class={styles.actions}>
                        <button class={styles.actionBtn} onClick={() => openEdit(p)} title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class={[styles.actionBtn, styles.actionDelete].join(" ")} onClick={() => setShowDelete(p.id)} title="Hapus">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal()} onClose={() => setShowModal(false)}
        title={editingId() ? "Edit Produk" : "Tambah Produk Baru"} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button><Button loading={saving()} onClick={handleSave}>{editingId() ? "Simpan" : "Tambah"}</Button></>}>
        <div class={styles.formGrid}>
          <Input label="Nama Produk" placeholder="cth. Dimsum Ayam 6 pcs" value={form().name}
            onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} class={styles.colSpan2} />
          <Select label="Kategori" options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Pilih kategori" value={form().category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.currentTarget.value }))} />
          <Select label="Satuan" options={UNITS.map((u) => ({ value: u, label: u }))}
            value={form().unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.currentTarget.value }))} />
          <Input label="Harga Jual (Rp)" type="number" placeholder="0" value={form().price || ""}
            onInput={(e) => setForm((f) => ({ ...f, price: parseFloat(e.currentTarget.value) || 0 }))} />
          <Input label="Harga Modal (Rp)" type="number" placeholder="0" value={form().costPrice || ""}
            onInput={(e) => setForm((f) => ({ ...f, costPrice: parseFloat(e.currentTarget.value) || 0 }))} />
          <Input label="Stok Awal" type="number" placeholder="0" value={form().stock || ""}
            onInput={(e) => setForm((f) => ({ ...f, stock: parseInt(e.currentTarget.value) || 0 }))} />
          <div class={styles.activeToggle}>
            <label class={styles.toggleLabel}>
              <input type="checkbox" checked={form().isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.currentTarget.checked }))} class={styles.toggleInput} />
              <span class={styles.toggleSlider} /><span>Produk Aktif</span>
            </label>
          </div>
        </div>
        <Show when={form().price > 0 && form().costPrice > 0}>
          <div class={styles.marginPreview}>
            Margin: <strong>{((form().price - form().costPrice) / form().price * 100).toFixed(1)}%</strong>
            {" — "}Laba per unit: <strong style={{ color: "var(--color-success)" }}>{formatCurrency(form().price - form().costPrice)}</strong>
          </div>
        </Show>
      </Modal>

      <Modal open={!!showDelete()} onClose={() => setShowDelete(null)} title="Hapus Produk" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowDelete(null)}>Batal</Button><Button variant="danger" loading={deleting()} onClick={() => handleDelete(showDelete()!)}>Hapus</Button></>}>
        <p style={{ "font-size": "14px", color: "var(--color-text-secondary)", "line-height": "1.6" }}>
          Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
