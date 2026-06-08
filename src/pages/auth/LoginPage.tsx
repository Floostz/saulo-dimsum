// src/pages/auth/LoginPage.tsx
import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../../store/auth";
import styles from "./LoginPage.module.css";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { toast } from "../../components/ui/Toast";
import logo from "../../assets/logo2.png";

const FEATURES = [
  {
    label: "Kasir & POS Realtime",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    label: "Audit Keuangan Lengkap",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    label: "Laporan Excel Otomatis",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: "Monitor Stok Bahan",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
];

export default function LoginPage() {
  const [email, setEmail] = createSignal("admin@saulo.com");
  const [password, setPassword] = createSignal("admin123");
  const [loading, setLoading] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);
  const { signIn, demoMode } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    if (!email() || !password()) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await signIn(email(), password());
      navigate("/dashboard");
    } catch (err: any) {
      const code = err?.code ?? err?.message ?? "";
      if (
        code.includes("wrong-password") ||
        code.includes("user-not-found") ||
        code.includes("invalid-credential") ||
        code === "auth/wrong-password"
      ) {
        toast.error("Login gagal", "Email atau password tidak valid");
      } else if (code.includes("too-many-requests")) {
        toast.error("Terlalu banyak percobaan", "Coba lagi beberapa saat");
      } else {
        toast.error("Login gagal", "Periksa koneksi internet Anda");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "kasir") => {
    setEmail(role === "admin" ? "admin@saulo.com" : "kasir@saulo.com");
    setPassword(role === "admin" ? "admin123" : "kasir123");
  };

  return (
    <div class={styles.page}>
      <div class={styles.card}>

        {/* ── Left brand panel ──────────────────── */}
        <div class={styles.brand}>
          <div class={styles.brandInner}>
            <div class={styles.brandTop}>

              <div class={styles.brandLogo}>
                <img src={logo} alt="Saulo Dimsum" class={styles.logoImage} />
              </div>

              <div class={styles.brandText}>
                <h1 class={styles.brandName}>Saulo Dimsum</h1>
                <p class={styles.brandTagline}>
                  Platform manajemen bisnis dimsum yang elegan dan efisien
                </p>
              </div>

              <div class={styles.brandDivider} />

              <div class={styles.brandFeatures}>
                {FEATURES.map((f) => (
                  <div class={styles.featureItem}>
                    <span class={styles.featureIcon}>{f.icon}</span>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class={styles.brandBottom}>
           
            </div>
          </div>
        </div>

        {/* ── Right form panel ──────────────────── */}
        <div class={styles.formPanel}>
          <div class={styles.formInner}>

            <div class={styles.formHeader}>
              <div class={styles.formEyebrow}>
                <span class={styles.eyebrowLine} />
                
              </div>
              <h2 class={styles.formTitle}>Selamat datang kembali</h2>
              <p class={styles.formSubtitle}>Masuk untuk mengakses Dashbor Anda</p>
            </div>

            <form class={styles.form} onSubmit={handleLogin}>
              <Input
                label="Email"
                type="email"
                placeholder="admin@saulo.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                required
                leftIcon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                }
              />

              <Input
                label="Password"
                type={showPassword() ? "text" : "password"}
                placeholder="Masukkan password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                required
                leftIcon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword())}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      "align-items": "center",
                      color: "var(--color-text-muted)",
                      padding: "0",
                    }}
                    aria-label={showPassword() ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    <Show
                      when={showPassword()}
                      fallback={
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      }
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    </Show>
                  </button>
                }
              />

              <div data-submit>
                <Button type="submit" size="lg" fullWidth loading={loading()}>
                  {loading() ? "Memverifikasi…" : "Masuk"}
                </Button>
              </div>
            </form>

    
              

            <div class={styles.formFooter}>
              <Show when={!demoMode}>
                <div class={styles.firebaseNote}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Terhubung ke Firebase Authentication</span>
                </div>
              </Show>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}