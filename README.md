# Saulo Dimsum Admin

Platform manajemen bisnis dimsum yang modern dan elegan — dibangun dengan SolidJS + Firebase.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | SolidJS + TypeScript |
| Bundler | Vite |
| Styling | CSS Modules |
| Routing | @solidjs/router |
| Backend | Firebase (Auth + Firestore + Storage) |
| Export | XLSX (SheetJS) |
| Icons | Inline SVG (Lucide-style) |

---

## Fitur Utama

- **Login/Logout** dengan Firebase Auth + protected routes per role
- **Dashboard** — statistik harian/bulanan, grafik penjualan, produk terlaris, stok hampir habis
- **POS / Kasir** — cart, search produk, kategori, qty, diskon, metode bayar (cash/QRIS/transfer), invoice, cetak struk
- **Produk** — CRUD, harga modal/jual, stok, kategori, margin otomatis
- **Pengeluaran** — CRUD, kategori, supplier, filter tanggal
- **Keuangan** — saldo realtime, arus kas, ringkasan bulanan, filter tanggal
- **Stok Bahan** — CRUD, penyesuaian stok, alert stok menipis
- **Laporan** — harian/bulanan/tahunan/custom, export Excel (.xlsx) 3 sheet
- **Pengguna** — CRUD user, role admin/kasir, aktifkan/nonaktifkan

---

## Struktur Folder

```
saulo-dimsum/
├── src/
│   ├── components/
│   │   ├── ui/              # Button, Card, Input, Modal, Toast, Badge
│   │   └── layout/          # AppLayout, Sidebar, Navbar
│   ├── pages/
│   │   ├── auth/            # LoginPage
│   │   ├── dashboard/       # DashboardPage
│   │   ├── pos/             # POSPage
│   │   ├── products/        # ProductsPage
│   │   ├── expenses/        # ExpensesPage
│   │   ├── finance/         # FinancePage
│   │   ├── stocks/          # StocksPage
│   │   ├── reports/         # ReportsPage
│   │   └── users/           # UsersPage
│   ├── store/               # auth.ts (SolidJS context)
│   ├── lib/                 # firebase.ts, firestore.ts, dummyData.ts
│   ├── types/               # index.ts (TypeScript types)
│   ├── utils/               # index.ts, exportExcel.ts
│   ├── styles/              # globals.css
│   ├── App.tsx
│   └── index.tsx
├── scripts/
│   └── seed.ts              # Firebase seed script
├── public/
│   └── favicon.svg
├── firestore.rules          # Firebase Security Rules
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Firestore Schema

### `users/{uid}`
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "role": "admin | kasir",
  "isActive": true,
  "createdAt": "Timestamp"
}
```

### `products/{productId}`
```json
{
  "name": "Dimsum Ayam (6 pcs)",
  "category": "Dimsum",
  "price": 18000,
  "costPrice": 9000,
  "stock": 45,
  "unit": "porsi",
  "imageUrl": "string | null",
  "isActive": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### `transactions/{txId}`
```json
{
  "transactionNumber": "TRX-20250115-0001",
  "items": [
    {
      "product": { "...productFields" },
      "qty": 2,
      "discount": 0,
      "subtotal": 36000
    }
  ],
  "subtotal": 36000,
  "totalDiscount": 0,
  "total": 36000,
  "paymentMethod": "cash | qris | transfer",
  "cashAmount": 50000,
  "change": 14000,
  "cashierId": "uid",
  "cashierName": "string",
  "note": "string | null",
  "createdAt": "Timestamp"
}
```

### `expenses/{expenseId}`
```json
{
  "description": "Pembelian tepung terigu",
  "category": "Bahan Baku",
  "amount": 175000,
  "supplier": "Pasar Wage",
  "receiptUrl": "string | null",
  "date": "Timestamp",
  "createdBy": "uid",
  "createdAt": "Timestamp"
}
```

### `stocks/{stockId}`
```json
{
  "name": "Tepung Terigu",
  "unit": "kg",
  "currentStock": 25,
  "minStock": 10,
  "costPerUnit": 12000,
  "linkedProducts": ["productId1"],
  "updatedAt": "Timestamp"
}
```

---

## Setup & Instalasi

### 1. Clone & install dependencies
```bash
git clone <repo>
cd saulo-dimsum
npm install
```

### 2. Setup Firebase
1. Buat project di [Firebase Console](https://console.firebase.google.com)
2. Aktifkan: **Authentication** (Email/Password), **Firestore Database**, **Storage**
3. Copy config ke `src/lib/firebase.ts`

### 3. Deploy Firestore Rules
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 4. Seed data awal
```bash
# Pastikan update firebaseConfig di scripts/seed.ts terlebih dahulu
npx tsx scripts/seed.ts
```

**Akun demo setelah seed:**
- Admin: `admin@saulo.com` / `admin123`
- Kasir: `kasir@saulo.com` / `kasir123`

### 5. Jalankan development server
```bash
npm run dev
# Buka http://localhost:3000
```

### 6. Build production
```bash
npm run build
npm run preview
```

---

## Role & Akses

| Fitur | Admin | Kasir |
|-------|-------|-------|
| Dashboard | Penuh | Ringkasan |
| POS / Kasir | Ya | Ya |
| Produk (CRUD) | Ya | Lihat saja |
| Pengeluaran | Ya | Tidak |
| Keuangan | Ya | Tidak |
| Stok Bahan | Ya | Lihat saja |
| Laporan | Ya | Tidak |
| Pengguna | Ya | Tidak |

---

## Export Excel

File Excel diekspor dengan 3 sheet:
1. **Ringkasan** — total pemasukan, pengeluaran, laba, jumlah transaksi
2. **Transaksi** — detail semua transaksi penjualan
3. **Pengeluaran** — semua catatan pengeluaran

---

## UI Design System

- **Primary:** `#C8102E` (Merah elegan)
- **Gold accent:** `#C9A840`
- **Font Display:** Noto Serif SC (Chinese-style headers)
- **Font Body:** DM Sans (clean modern)
- **Border radius:** 6px – 24px (tiered)
- **Shadows:** 4 levels (sm/md/lg/xl)
- **Transitions:** 150ms / 250ms / 400ms cubic-bezier

---

*Saulo Dimsum Admin — Production Ready*
