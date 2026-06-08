// src/App.tsx
import { lazy, Suspense, Show, type JSX } from "solid-js";
import { Router, Route, useNavigate } from "@solidjs/router";
import { AuthProvider, useAuth } from "./store/auth";
import AppLayout from "./components/layout/AppLayout";
import { ToastContainer } from "./components/ui/Toast";
import "./styles/globals.css";

// ── Lazy loaded pages ───────────────────────────────────────────────────────
const LoginPage    = lazy(() => import("./pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const POSPage      = lazy(() => import("./pages/pos/POSPage"));
const ProductsPage = lazy(() => import("./pages/products/ProductsPage"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage"));
const FinancePage  = lazy(() => import("./pages/finance/FinancePage"));
const StocksPage   = lazy(() => import("./pages/stocks/StocksPage"));
const ReportsPage  = lazy(() => import("./pages/reports/ReportsPage"));
const UsersPage    = lazy(() => import("./pages/users/UsersPage"));

// ── Loaders ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      display: "flex", "align-items": "center", "justify-content": "center",
      height: "100vh", background: "var(--color-bg)",
    }}>
      <div style={{
        width: "36px", height: "36px",
        border: "3px solid var(--color-border)",
        "border-top-color": "var(--color-primary)",
        "border-radius": "50%",
        animation: "spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div style={{ padding: "32px", display: "flex", "flex-direction": "column", gap: "16px" }}>
      {([1,2,3] as number[]).map(() => (
        <div class="skeleton" style={{ height: "72px", "border-radius": "12px" }} />
      ))}
    </div>
  );
}

// ── Auth guard ───────────────────────────────────────────────────────────────
function Protected(props: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <Show when={!loading()} fallback={<Spinner />}>
      <Show
        when={user()}
        fallback={<RedirectTo href="/login" />}
      >
        <Show
          when={!props.adminOnly || user()?.role === "admin"}
          fallback={<AccessDenied />}
        >
          <AppLayout>
            <Suspense fallback={<ContentSkeleton />}>
              {props.children}
            </Suspense>
          </AppLayout>
        </Show>
      </Show>
    </Show>
  );
}

function RedirectTo(props: { href: string }) {
  const navigate = useNavigate();
  // Use queueMicrotask to avoid "setState during render" issues
  queueMicrotask(() => navigate(props.href, { replace: true }));
  return null;
}

function AccessDenied() {
  return (
    <AppLayout>
      <div style={{
        display: "flex", "flex-direction": "column", "align-items": "center",
        "justify-content": "center", padding: "80px 20px", gap: "14px", "text-align": "center",
      }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-danger)" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <h2 style={{ "font-family": "var(--font-display)", "font-size": "22px",
          color: "var(--color-text)", "font-weight": "700" }}>
          Akses Ditolak
        </h2>
        <p style={{ color: "var(--color-text-muted)", "font-size": "14px",
          "max-width": "320px", "line-height": "1.6" }}>
          Anda tidak memiliki izin untuk mengakses halaman ini.
          Hubungi administrator untuk informasi lebih lanjut.
        </p>
      </div>
    </AppLayout>
  );
}

// ── Login route ──────────────────────────────────────────────────────────────
function LoginRoute() {
  const { user, loading } = useAuth();
  return (
    <Show when={!loading()} fallback={<Spinner />}>
      <Show
        when={!user()}
        fallback={<RedirectTo href="/dashboard" />}
      >
        <Suspense fallback={<Spinner />}>
          <LoginPage />
        </Suspense>
      </Show>
    </Show>
  );
}

// ── Page wrappers ────────────────────────────────────────────────────────────
const R = {
  Dashboard: () => <Protected><DashboardPage /></Protected>,
  POS:       () => <Protected><POSPage /></Protected>,
  Products:  () => <Protected adminOnly><ProductsPage /></Protected>,
  Expenses:  () => <Protected adminOnly><ExpensesPage /></Protected>,
  Finance:   () => <Protected adminOnly><FinancePage /></Protected>,
  Stocks:    () => <Protected adminOnly><StocksPage /></Protected>,
  Reports:   () => <Protected adminOnly><ReportsPage /></Protected>,
  Users:     () => <Protected adminOnly><UsersPage /></Protected>,
};

// ── Root ─────────────────────────────────────────────────────────────────────
function Root() {
  return (
    <>
      <Router>
        <Route path="/"          component={() => <RedirectTo href="/dashboard" />} />
        <Route path="/login"     component={LoginRoute} />
        <Route path="/dashboard" component={R.Dashboard} />
        <Route path="/pos"       component={R.POS} />
        <Route path="/products"  component={R.Products} />
        <Route path="/expenses"  component={R.Expenses} />
        <Route path="/finance"   component={R.Finance} />
        <Route path="/stocks"    component={R.Stocks} />
        <Route path="/reports"   component={R.Reports} />
        <Route path="/users"     component={R.Users} />
      </Router>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
