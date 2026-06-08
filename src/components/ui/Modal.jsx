// src/components/ui/Modal.tsx
import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import styles from "./Modal.module.css";
export default function Modal(props) {
    const handleBackdrop = (e) => {
        if (e.target.classList.contains(styles.overlay)) {
            props.onClose();
        }
    };
    return (<Show when={props.open}>
      <Portal>
        <div class={styles.overlay} onClick={handleBackdrop}>
          <div class={[styles.modal, styles[props.size ?? "md"]].join(" ")} role="dialog">
            <Show when={props.title}>
              <div class={styles.header}>
                <h3 class={styles.title}>{props.title}</h3>
                <button class={styles.close} onClick={props.onClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </Show>
            <div class={styles.body}>{props.children}</div>
            <Show when={props.footer}>
              <div class={styles.footer}>{props.footer}</div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>);
}
