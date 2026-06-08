// src/pages/users/UsersPage.tsx
import { createSignal, createResource, For, Show } from "solid-js";
import styles from "./UsersPage.module.css";
import Button from "../../components/ui/Button";
import { Input, Select, Badge } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { toast } from "../../components/ui/Toast";
import { AppUser, UserRole } from "../../types";
import { getUsers, updateUser } from "../../lib/firestore";
import { formatDate } from "../../utils";
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const emptyForm = () => ({
  displayName: "", email: "", role: "kasir" as UserRole, isActive: true, password: "",
});

export default function UsersPage() {
  const [users, { refetch }] = createResource<AppUser[]>(async () => {
    try { return await getUsers(); } catch { return []; }
  });

  const [showModal, setShowModal] = createSignal(false);
  const [editingUid, setEditingUid] = createSignal<string | null>(null);
  const [form, setForm] = createSignal(emptyForm());
  const [saving, setSaving] = createSignal(false);
  const [showDelete, setShowDelete] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const openAdd = () => { setEditingUid(null); setForm(emptyForm()); setShowModal(true); };

  const openEdit = (u: AppUser) => {
    setEditingUid(u.uid);
    setForm({ displayName: u.displayName, email: u.email, role: u.role, isActive: u.isActive, password: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    const f = form();
    if (!f.displayName.trim()) { toast.error("Nama lengkap wajib diisi"); return; }
    if (!f.email.trim()) { toast.error("Email wajib diisi"); return; }
    if (!editingUid() && !f.password) { toast.error("Password wajib diisi untuk akun baru"); return; }
    if (!editingUid() && f.password.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    setSaving(true);
    try {
      if (editingUid()) {
        await updateUser(editingUid()!, {
          displayName: f.displayName, role: f.role, isActive: f.isActive,
        });
        toast.success("Pengguna diperbarui");
      } else {
        // Create Firebase Auth account, then Firestore profile
        const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
        await setDoc(doc(db, "users", cred.user.uid), {
          email: f.email, displayName: f.displayName,
          role: f.role, isActive: f.isActive, createdAt: new Date(),
        });
        toast.success("Akun berhasil dibuat", `${f.displayName} dapat login sekarang`);
      }
      setShowModal(false);
      refetch();
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "auth/email-already-in-use") toast.error("Email sudah digunakan");
      else if (code === "auth/invalid-email") toast.error("Format email tidak valid");
      else if (code === "auth/weak-password") toast.error("Password terlalu lemah");
      else toast.error("Gagal menyimpan", "Periksa koneksi Firebase Anda");
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (u: AppUser) => {
    try {
      await updateUser(u.uid, { isActive: !u.isActive });
      toast.info(`Akun ${u.displayName} ${u.isActive ? "dinonaktifkan" : "diaktifkan"}`);
      refetch();
    } catch { toast.error("Gagal mengubah status"); }
  };

  return (
    <div class={[styles.page, "page-enter"].join(" ")}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Manajemen Pengguna</h1>
          <p class={styles.subtitle}>
            <Show when={!users.loading}>{(users() ?? []).length} pengguna terdaftar</Show>
            <Show when={users.loading}>Memuat...</Show>
          </p>
        </div>
        <Button onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Pengguna
        </Button>
      </div>

      <Show when={users.loading}>
        <div class={styles.loadingState}><div class={styles.loadingSpinner} /><span>Memuat data pengguna...</span></div>
      </Show>

      <Show when={!users.loading && (users() ?? []).length === 0}>
        <div class={styles.emptyFull}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>Belum ada pengguna terdaftar</p>
          <span>Tambahkan pengguna pertama untuk mulai menggunakan sistem</span>
          <Button onClick={openAdd}>Tambah Pengguna Pertama</Button>
        </div>
      </Show>

      <Show when={!users.loading && (users() ?? []).length > 0}>
        <div class={styles.usersGrid}>
          <For each={users() ?? []}>
            {(u) => (
              <div class={[styles.userCard, !u.isActive && styles.userInactive].filter(Boolean).join(" ")}>
                <div class={styles.userCardTop}>
                  <div class={styles.avatar}>
                    {u.displayName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </div>
                  <div class={styles.userMeta}>
                    <Badge variant={u.role === "admin" ? "danger" : "info"} size="sm">
                      {u.role === "admin" ? "Admin" : "Kasir"}
                    </Badge>
                    <Badge variant={u.isActive ? "success" : "default"} size="sm">
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </div>
                <div class={styles.userInfo}>
                  <h4 class={styles.userName}>{u.displayName}</h4>
                  <p class={styles.userEmail}>{u.email}</p>
                  <p class={styles.userJoined}>
                    Bergabung: {u.createdAt
                      ? (u.createdAt instanceof Date
                          ? u.createdAt
                          : (u.createdAt as any).toDate?.() ?? new Date()
                        ).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div class={styles.userActions}>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(u)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </Button>
                  <Button variant={u.isActive ? "ghost" : "success"} size="sm" onClick={() => handleToggleActive(u)}>
                    {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Role info */}
      <div class={styles.rolesCard}>
        <h3 class={styles.rolesTitle}>Hak Akses per Role</h3>
        <div class={styles.rolesGrid}>
          <div class={styles.roleItem}>
            <Badge variant="danger">Admin</Badge>
            <div class={styles.rolePermissions}>
              {["Dashboard lengkap","Kasir / POS","Manajemen produk","Kelola pengeluaran","Laporan keuangan","Manajemen stok","Manajemen pengguna"].map((p) => <span>{p}</span>)}
            </div>
          </div>
          <div class={styles.roleItem}>
            <Badge variant="info">Kasir</Badge>
            <div class={styles.rolePermissions}>
              {["Dashboard ringkasan","Kasir / POS saja","Melihat produk aktif"].map((p) => <span>{p}</span>)}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showModal()} onClose={() => setShowModal(false)}
        title={editingUid() ? "Edit Pengguna" : "Tambah Pengguna Baru"} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button><Button loading={saving()} onClick={handleSave}>{editingUid() ? "Simpan" : "Buat Akun"}</Button></>}>
        <div class={styles.formGrid}>
          <Input label="Nama Lengkap" placeholder="cth. Siti Rahma" value={form().displayName}
            onInput={(e) => setForm((f) => ({ ...f, displayName: e.currentTarget.value }))} class={styles.colSpan2} />
          <Input label="Email" type="email" placeholder="email@saulo.com" value={form().email}
            onInput={(e) => setForm((f) => ({ ...f, email: e.currentTarget.value }))}
            class={styles.colSpan2} disabled={!!editingUid()} />
          <Show when={!editingUid()}>
            <Input label="Password" type="password" placeholder="Min. 6 karakter" value={form().password}
              onInput={(e) => setForm((f) => ({ ...f, password: e.currentTarget.value }))} class={styles.colSpan2} />
          </Show>
          <Select label="Role" options={[{ value: "admin", label: "Admin" }, { value: "kasir", label: "Kasir" }]}
            value={form().role} onChange={(e) => setForm((f) => ({ ...f, role: e.currentTarget.value as UserRole }))} />
          <div class={styles.activeField}>
            <label class={styles.toggleLabel}>
              <input type="checkbox" checked={form().isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.currentTarget.checked }))} class={styles.toggleInput} />
              <span class={styles.toggleSlider} /><span>Akun Aktif</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
