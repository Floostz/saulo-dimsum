// src/pages/pos/POSPage.tsx
import { createSignal, createMemo, createResource, For, Show } from "solid-js";
import styles from "./POSPage.module.css";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { toast } from "../../components/ui/Toast";
import { CartItem, PaymentMethod, Product } from "../../types";
import { subscribeProducts, addTransaction } from "../../lib/firestore";
import { formatCurrency, calculateCartTotals, generateTransactionNumber } from "../../utils";
import { useAuth } from "../../store/auth";

export default function POSPage() {
  const { user } = useAuth();

  // Live product subscription
  const [products, setProducts] = createSignal<Product[]>([]);
  const [productsLoading, setProductsLoading] = createSignal(true);

  subscribeProducts((prods) => {
    setProducts(prods);
    setProductsLoading(false);
  });

  const [cart, setCart] = createSignal<CartItem[]>([]);
  const [search, setSearch] = createSignal("");
  const [selectedCategory, setSelectedCategory] = createSignal("Semua");
  const [showPayment, setShowPayment] = createSignal(false);
  const [showInvoice, setShowInvoice] = createSignal(false);
  const [paymentMethod, setPaymentMethod] = createSignal<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = createSignal("");
  const [note, setNote] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [lastTx, setLastTx] = createSignal<{ number: string; total: number; change: number; method: string } | null>(null);

  // Derive categories dynamically from loaded products
  const categories = createMemo(() => {
    const cats = [...new Set(products().map((p) => p.category))].sort();
    return ["Semua", ...cats];
  });

  const filtered = createMemo(() =>
    products().filter((p) => {
      const ms = p.name.toLowerCase().includes(search().toLowerCase());
      const mc = selectedCategory() === "Semua" || p.category === selectedCategory();
      return ms && mc;
    })
  );

  const totals = createMemo(() => calculateCartTotals(cart()));
  const change = createMemo(() => Math.max(0, (parseFloat(cashAmount()) || 0) - totals().total));

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { toast.warning("Stok habis", `${product.name} sudah habis`); return; }
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1,
          subtotal: (updated[idx].qty + 1) * product.price * (1 - updated[idx].discount / 100) };
        return updated;
      }
      return [...prev, { product, qty: 1, discount: 0, subtotal: product.price }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { setCart((prev) => prev.filter((c) => c.product.id !== productId)); return; }
    setCart((prev) => prev.map((c) =>
      c.product.id === productId
        ? { ...c, qty, subtotal: qty * c.product.price * (1 - c.discount / 100) } : c
    ));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prev) => prev.map((c) =>
      c.product.id === productId
        ? { ...c, discount, subtotal: c.qty * c.product.price * (1 - discount / 100) } : c
    ));
  };

  const handleCheckout = async () => {
    if (cart().length === 0) return;
    if (paymentMethod() === "cash" && (parseFloat(cashAmount()) || 0) < totals().total) {
      toast.error("Uang kurang", "Jumlah uang tidak mencukupi total tagihan"); return;
    }
    setSaving(true);
    try {
      const txNumber = generateTransactionNumber();
      await addTransaction({
        transactionNumber: txNumber,
        items: cart(),
        subtotal: totals().subtotal,
        totalDiscount: totals().totalDiscount,
        total: totals().total,
        paymentMethod: paymentMethod(),
        cashAmount: paymentMethod() === "cash" ? parseFloat(cashAmount()) : undefined,
        change: paymentMethod() === "cash" ? change() : undefined,
        cashierId: user()?.uid ?? "",
        cashierName: user()?.displayName ?? "",
        note: note() || undefined,
        createdAt: new Date(),
      });
      setLastTx({ number: txNumber, total: totals().total, change: change(), method: paymentMethod() });
      setShowPayment(false);
      setShowInvoice(true);
      toast.success("Transaksi berhasil!", txNumber);
    } catch { toast.error("Gagal menyimpan transaksi", "Periksa koneksi Firebase Anda"); }
    finally { setSaving(false); }
  };

  const handleNewTransaction = () => {
    setCart([]); setShowInvoice(false); setCashAmount(""); setNote(""); setPaymentMethod("cash");
  };

  return (
    <div class={styles.page}>
      {/* Product Panel */}
      <div class={styles.productPanel}>
        <div class={styles.productHeader}>
          <Input placeholder="Cari produk..." value={search()} onInput={(e) => setSearch(e.currentTarget.value)}
            inputClass={styles.searchInput}
            leftIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>} />
          <div class={styles.categories}>
            <For each={categories()}>
              {(cat) => (
                <button class={[styles.catBtn, selectedCategory() === cat && styles.catActive].filter(Boolean).join(" ")}
                  onClick={() => setSelectedCategory(cat)}>{cat}</button>
              )}
            </For>
          </div>
        </div>

        <div class={styles.productGrid}>
          <Show when={productsLoading()}>
            <div class={styles.loadingOverlay}>
              <div class={styles.loadingSpinner} />
              <span>Memuat produk dari Firebase...</span>
            </div>
          </Show>
          <Show when={!productsLoading() && products().length === 0}>
            <div class={styles.noProducts}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              <p>Belum ada produk</p>
              <span>Tambahkan produk terlebih dahulu di menu Produk</span>
            </div>
          </Show>
          <Show when={!productsLoading() && products().length > 0 && filtered().length === 0}>
            <div class={styles.noProducts}><p>Produk tidak ditemukan</p></div>
          </Show>
          <For each={filtered()}>
            {(product) => (
              <button class={[styles.productCard, product.stock <= 0 && styles.outOfStock].filter(Boolean).join(" ")}
                onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                <div class={styles.productImagePlaceholder}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.2">
                    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <div class={styles.productInfo}>
                  <span class={styles.productName}>{product.name}</span>
                  <span class={styles.productCategory}>{product.category}</span>
                  <span class={styles.productPrice}>{formatCurrency(product.price)}</span>
                  <span class={[styles.productStock, product.stock <= 5 && product.stock > 0 ? styles.lowStock : ""].filter(Boolean).join(" ")}>
                    Stok: {product.stock}
                  </span>
                </div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Cart Panel */}
      <div class={styles.cartPanel}>
        <div class={styles.cartHeader}>
          <h3 class={styles.cartTitle}>Keranjang</h3>
          <Show when={cart().length > 0}>
            <button class={styles.clearBtn} onClick={() => setCart([])}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Kosongkan
            </button>
          </Show>
        </div>

        <div class={styles.cartItems}>
          <Show when={cart().length === 0}>
            <div class={styles.emptyCart}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Keranjang kosong</p>
              <span>Pilih produk untuk memulai transaksi</span>
            </div>
          </Show>
          <For each={cart()}>
            {(item) => (
              <div class={styles.cartItem}>
                <div class={styles.cartItemTop}>
                  <span class={styles.cartItemName}>{item.product.name}</span>
                  <span class={styles.cartItemSubtotal}>{formatCurrency(item.subtotal)}</span>
                </div>
                <div class={styles.cartItemControls}>
                  <div class={styles.qtyControl}>
                    <button class={styles.qtyBtn} onClick={() => updateQty(item.product.id, item.qty - 1)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <span class={styles.qtyVal}>{item.qty}</span>
                    <button class={styles.qtyBtn} onClick={() => updateQty(item.product.id, item.qty + 1)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                  <div class={styles.discountWrap}>
                    <input class={styles.discountInput} type="number" min="0" max="100" placeholder="0"
                      value={item.discount}
                      onInput={(e) => updateDiscount(item.product.id, parseFloat(e.currentTarget.value) || 0)} />
                    <span class={styles.discountSuffix}>%</span>
                  </div>
                  <span class={styles.unitPrice}>{formatCurrency(item.product.price)}/pcs</span>
                </div>
              </div>
            )}
          </For>
        </div>

        <div class={styles.cartFooter}>
          <div class={styles.totalsBlock}>
            <div class={styles.totalRow}><span>Subtotal</span><span>{formatCurrency(totals().subtotal)}</span></div>
            <Show when={totals().totalDiscount > 0}>
              <div class={[styles.totalRow, styles.discountRow].join(" ")}>
                <span>Diskon</span><span>-{formatCurrency(totals().totalDiscount)}</span>
              </div>
            </Show>
            <div class={[styles.totalRow, styles.grandTotal].join(" ")}>
              <span>Total</span><span>{formatCurrency(totals().total)}</span>
            </div>
          </div>
          <Button size="lg" fullWidth disabled={cart().length === 0} onClick={() => setShowPayment(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Bayar {cart().length > 0 ? formatCurrency(totals().total) : ""}
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={showPayment()} onClose={() => setShowPayment(false)} title="Konfirmasi Pembayaran" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowPayment(false)}>Batal</Button><Button loading={saving()} onClick={handleCheckout}>Proses Pembayaran</Button></>}>
        <div class={styles.paymentModal}>
          <div class={styles.paymentTotal}>
            <span>Total Tagihan</span>
            <span class={styles.paymentAmount}>{formatCurrency(totals().total)}</span>
          </div>
          <div class={styles.paymentMethods}>
            <label class={styles.payMethodLabel}>Metode Pembayaran</label>
            <div class={styles.methodBtns}>
              {(["cash", "qris", "transfer"] as PaymentMethod[]).map((m) => (
                <button class={[styles.methodBtn, paymentMethod() === m && styles.methodActive].filter(Boolean).join(" ")}
                  onClick={() => setPaymentMethod(m)}>
                  {m === "cash" ? "Tunai" : m === "qris" ? "QRIS" : "Transfer"}
                </button>
              ))}
            </div>
          </div>
          <Show when={paymentMethod() === "cash"}>
            <Input label="Uang Diterima (Rp)" type="number" placeholder="0" value={cashAmount()}
              onInput={(e) => setCashAmount(e.currentTarget.value)} />
            <Show when={(parseFloat(cashAmount()) || 0) >= totals().total}>
              <div class={styles.changeInfo}>
                <span>Kembalian</span>
                <span class={styles.changeAmount}>{formatCurrency(change())}</span>
              </div>
            </Show>
          </Show>
          <Input label="Catatan (opsional)" placeholder="Tambahkan catatan..." value={note()}
            onInput={(e) => setNote(e.currentTarget.value)} />
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal open={showInvoice()} onClose={handleNewTransaction} title="Transaksi Berhasil" size="sm"
        footer={<><Button variant="secondary" onClick={() => window.print()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Cetak Struk</Button><Button onClick={handleNewTransaction}>Transaksi Baru</Button></>}>
        <div class={styles.invoiceModal}>
          <div class={styles.invoiceSuccess}>
            <div class={styles.successIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h4>Pembayaran Diterima</h4>
          </div>
          <div class={styles.invoiceDetails}>
            <div class={styles.invoiceRow}><span>No. Transaksi</span><span class={styles.invoiceCode}>{lastTx()?.number}</span></div>
            <div class={styles.invoiceRow}><span>Total</span><span class={styles.invoiceTotal}>{formatCurrency(lastTx()?.total ?? 0)}</span></div>
            <Show when={(lastTx()?.change ?? 0) > 0}>
              <div class={styles.invoiceRow}><span>Kembalian</span><span class={styles.invoiceChange}>{formatCurrency(lastTx()?.change ?? 0)}</span></div>
            </Show>
            <div class={styles.invoiceRow}><span>Metode</span><span>{lastTx()?.method?.toUpperCase()}</span></div>
            <div class={styles.invoiceRow}><span>Kasir</span><span>{user()?.displayName}</span></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
