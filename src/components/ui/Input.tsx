// src/components/ui/Input.tsx
import { JSX, Show, splitProps } from "solid-js";
import styles from "./Input.module.css";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  inputClass?: string;
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["label", "error", "hint", "leftIcon", "rightIcon", "inputClass", "class"]);

  return (
    <div class={[styles.field, local.class].filter(Boolean).join(" ")}>
      <Show when={local.label}>
        <label class={styles.label}>{local.label}</label>
      </Show>
      <div class={[styles.inputWrap, local.error && styles.hasError].filter(Boolean).join(" ")}>
        <Show when={local.leftIcon}>
          <span class={styles.iconLeft}>{local.leftIcon}</span>
        </Show>
        <input
          class={[styles.input, local.leftIcon && styles.withLeft, local.rightIcon && styles.withRight, local.inputClass].filter(Boolean).join(" ")}
          {...rest}
        />
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
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, ["label", "error", "options", "placeholder", "class"]);

  return (
    <div class={[styles.field, local.class].filter(Boolean).join(" ")}>
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
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea(props: TextareaProps) {
  const [local, rest] = splitProps(props, ["label", "error", "class"]);
  return (
    <div class={[styles.field, local.class].filter(Boolean).join(" ")}>
      <Show when={local.label}>
        <label class={styles.label}>{local.label}</label>
      </Show>
      <textarea class={[styles.input, styles.textarea, local.error && styles.hasError].filter(Boolean).join(" ")} {...rest} />
      <Show when={local.error}>
        <span class={styles.error}>{local.error}</span>
      </Show>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "gold";

interface BadgeProps {
  variant?: BadgeVariant;
  children: JSX.Element;
  size?: "sm" | "md";
}

export function Badge(props: BadgeProps) {
  return (
    <span class={[
      styles.badge,
      styles[`badge-${props.variant ?? "default"}`],
      props.size === "sm" && styles["badge-sm"],
    ].filter(Boolean).join(" ")}>
      {props.children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar(props: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = () => props.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div class={[styles.avatar, styles[`avatar-${props.size ?? "md"}`]].join(" ")}>
      {initials()}
    </div>
  );
}
