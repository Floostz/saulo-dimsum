// src/components/ui/Button.tsx
import { Show, splitProps } from "solid-js";
import styles from "./Button.module.css";
export default function Button(props) {
    const [local, rest] = splitProps(props, [
        "variant", "size", "loading", "fullWidth", "iconOnly", "children", "class",
    ]);
    const variant = () => local.variant ?? "primary";
    const size = () => local.size ?? "md";
    const cls = () => [
        styles.btn,
        styles[variant()],
        styles[size()],
        local.fullWidth && styles.fullWidth,
        local.iconOnly && styles.icon,
        local.class,
    ].filter(Boolean).join(" ");
    return (<button class={cls()} disabled={local.loading || rest.disabled} {...rest}>
      <Show when={local.loading}>
        <span class={styles.spinner}/>
      </Show>
      <Show when={!local.loading}>
        {local.children}
      </Show>
    </button>);
}
