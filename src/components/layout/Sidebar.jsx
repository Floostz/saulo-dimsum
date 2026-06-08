// src/components/layout/Sidebar.tsx
import { Show, For } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import styles from "./Sidebar.module.css";
import { useAuth } from "../../store/auth";
const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/pos", label: "Kasir / POS", icon: "shopping-cart" },
    { href: "/products", label: "Produk", icon: "package" },
    { href: "/expenses", label: "Pengeluaran", icon: "credit-card" },
    { href: "/finance", label: "Keuangan", icon: "trending-up" },
    { href: "/stocks", label: "Stok Bahan", icon: "archive" },
    { href: "/reports", label: "Laporan", icon: "bar-chart-2" },
    { href: "/users", label: "Pengguna", icon: "users", adminOnly: true },
];
// Inline SVG icons map
const Icon = (props) => {
    const s = props.size ?? 18;
    const icons = {
        "grid": `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
        "shopping-cart": `<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,
        "package": `<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
        "credit-card": `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>`,
        "trending-up": `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
        "archive": `<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>`,
        "bar-chart-2": `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
        "users": `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
        "log-out": `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
        "menu": `<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`,
        "x": `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
        "chevron-right": `<polyline points="9 18 15 12 9 6"/>`,
    };
    return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" innerHTML={icons[props.name] ?? ""}/>);
};
export { Icon };
export default function Sidebar(props) {
    const loc = useLocation();
    const { user, signOut, isAdmin } = useAuth();
    const isActive = (href) => loc.pathname.startsWith(href);
    return (<>
      {/* Mobile Overlay */}
      <Show when={props.mobileOpen}>
        <div class={styles.mobileOverlay} onClick={props.onClose}/>
      </Show>

      <aside class={[styles.sidebar, props.mobileOpen && styles.mobileOpen].filter(Boolean).join(" ")}>
        {/* Logo */}
        <div class={styles.logo}>
      <div class={styles.logoMark}>
  <img src="src/assets/logo2.png" alt="Logo" class={styles.logoImg} />
</div>
          <div class={styles.logoText}>
            <span class={styles.logoMain}>Saulo</span>
            <span class={styles.logoSub}>Dimsum Admin</span>
          </div>
          <button class={styles.mobileClose} onClick={props.onClose}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {/* Nav */}
        <nav class={styles.nav}>
          <div class={styles.navSection}>
            <span class={styles.sectionLabel}>Menu</span>
            <For each={navItems}>
              {(item) => (<Show when={!item.adminOnly || isAdmin()}>
                  <A href={item.href} class={[styles.navItem, isActive(item.href) && styles.active].filter(Boolean).join(" ")} onClick={props.onClose}>
                    <span class={styles.navIcon}><Icon name={item.icon} size={17}/></span>
                    <span class={styles.navLabel}>{item.label}</span>
                    <Show when={isActive(item.href)}>
                      <span class={styles.activeIndicator}/>
                    </Show>
                  </A>
                </Show>)}
            </For>
          </div>
        </nav>

        {/* Footer */}
        <div class={styles.sidebarFooter}>
          <div class={styles.userCard}>
            <div class={styles.userAvatar}>
              {user()?.displayName?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div class={styles.userInfo}>
              <span class={styles.userName}>{user()?.displayName ?? "User"}</span>
              <span class={styles.userRole}>{user()?.role === "admin" ? "Administrator" : "Kasir"}</span>
            </div>
            <button class={styles.logoutBtn} onClick={signOut} title="Logout">
              <Icon name="log-out" size={15}/>
            </button>
          </div>
        </div>
      </aside>
    </>);
}
