// src/components/ui/Input.tsx
import { Show, splitProps } from "solid-js";
import styles from "./Input.module.css";
export function Input(props) {
    const [local, rest] = splitProps(props, ["label", "error", "hint", "leftIcon", "rightIcon", "inputClass", "class"]);
    return (<div class={[styles.field, local.class].filter(Boolean).join(" ")}>
      <Show when={local.label}>
        <label class={styles.label}>{local.label}</label>
      </Show>
      <div class={[styles.inputWrap, local.error && styles.hasError].filter(Boolean).join(" ")}>
        <Show when={local.leftIcon}>
          <span class={styles.iconLeft}>{local.leftIcon}</span>
        </Show>
        <input class={[styles.input, local.leftIcon && styles.withLeft, local.rightIcon && styles.withRight, local.inputClass].filter(Boolean).join(" ")} {...rest}/>
        <Show when={local.rightIcon}>
          <span class={styles.iconRight}>{local.rightIcon}</span>
        </Show>
      </div>
      <Show when={local.error}>
        <span class={styles.error}>{local.error}</span>
      </Show>
      <Show when={local.hint && !local.error}>
        <span class={styles.hint}>{local.hint}</span>
      </Show>
    </div>);
}
export function Select(props) {
    const [local, rest] = splitProps(props, ["label", "error", "options", "placeholder", "class"]);
    return (<div class={[styles.field, local.class].filter(Boolean).join(" ")}>
      <Show when={local.label}>
        <label class={styles.label}>{local.label}</label>
      </Show>
      <div class={[styles.inputWrap, local.error && styles.hasError].filter(Boolean).join(" ")}>
        <select class={[styles.input, styles.select].join(" ")} {...rest}>
          <Show when={local.placeholder}>
            <option value="">{local.placeholder}</option>
          </Show>
          {local.options.map((o) => <option value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <Show when={local.error}>
        <span class={styles.error}>{local.error}</span>
      </Show>
    </div>);
}
export function Textarea(props) {
    const [local, rest] = splitProps(props, ["label", "error", "class"]);
    return (<div class={[styles.field, local.class].filter(Boolean).join(" ")}>
      <Show when={local.label}>
        <label class={styles.label}>{local.label}</label>
      </Show>
      <textarea class={[styles.input, styles.textarea, local.error && styles.hasError].filter(Boolean).join(" ")} {...rest}/>
      <Show when={local.error}>
        <span class={styles.error}>{local.error}</span>
      </Show>
    </div>);
}
export function Badge(props) {
    return (<span class={[
            styles.badge,
            styles[`badge-${props.variant ?? "default"}`],
            props.size === "sm" && styles["badge-sm"],
        ].filter(Boolean).join(" ")}>
      {props.children}
    </span>);
}
// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar(props) {
    const initials = () => props.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    return (<div class={[styles.avatar, styles[`avatar-${props.size ?? "md"}`]].join(" ")}>
      {initials()}
    </div>);
}
