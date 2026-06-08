// src/components/ui/Toast.tsx
import { createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import styles from "./Toast.module.css";
const [toasts, setToasts] = createSignal([]);
export const toast = {
    show(type, title, message) {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    },
    success: (title, message) => toast.show("success", title, message),
    error: (title, message) => toast.show("error", title, message),
    warning: (title, message) => toast.show("warning", title, message),
    info: (title, message) => toast.show("info", title, message),
};
const icons = {
    success: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>),
    error: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>),
    warning: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>),
    info: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>),
};
export function ToastContainer() {
    return (<Portal>
      <div class={styles.container}>
        <For each={toasts()}>
          {(t) => (<div class={[styles.toast, styles[t.type]].join(" ")}>
              <span class={styles.icon}>{icons[t.type]}</span>
              <div class={styles.content}>
                <div class={styles.title}>{t.title}</div>
                <Show when={t.message}>
                  <div class={styles.message}>{t.message}</div>
                </Show>
              </div>
              <button class={styles.dismiss} onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>)}
        </For>
      </div>
    </Portal>);
}
