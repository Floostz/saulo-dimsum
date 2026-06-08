// src/components/layout/AppLayout.tsx
import { createSignal } from "solid-js";
import { useLocation } from "@solidjs/router";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";
import { Icon } from "./Sidebar";
const pageTitles = {
    "/dashboard": "Dashboard",
    "/pos": "Kasir / POS",
    "/products": "Manajemen Produk",
    "/expenses": "Pengeluaran",
    "/finance": "Keuangan",
    "/stocks": "Stok Bahan",
    "/reports": "Laporan",
    "/users": "Manajemen Pengguna",
};
export default function AppLayout(props) {
    const [mobileOpen, setMobileOpen] = createSignal(false);
    const loc = useLocation();
    const pageTitle = () => {
        const key = Object.keys(pageTitles).find((k) => loc.pathname.startsWith(k));
        return key ? pageTitles[key] : "Saulo Dimsum";
    };
    return (<div class={styles.layout}>
      <Sidebar mobileOpen={mobileOpen()} onClose={() => setMobileOpen(false)}/>

      <div class={styles.main}>
        {/* Navbar */}
        <header class={styles.navbar}>
          <div class={styles.navLeft}>
            <button class={styles.menuBtn} onClick={() => setMobileOpen(true)}>
              <Icon name="menu" size={20}/>
            </button>
            <div class={styles.breadcrumb}>
              <span class={styles.breadcrumbBrand}>Saulo Dimsum</span>
              <span class={styles.breadcrumbSep}>
                <Icon name="chevron-right" size={13}/>
              </span>
              <span class={styles.breadcrumbPage}>{pageTitle()}</span>
            </div>
          </div>
          <div class={styles.navRight}>
            <div class={styles.dateDisplay}>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main class={styles.content}>
          {props.children}
        </main>
      </div>
    </div>);
}
