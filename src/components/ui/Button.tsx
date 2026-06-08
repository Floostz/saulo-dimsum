// src/components/ui/Button.tsx
import { JSX, Show, splitProps } from "solid-js";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline" | "gold";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  children?: JSX.Element;
}

export default function Button(props: ButtonProps) {
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

  return (
    <button class={cls()} disabled={local.loading || rest.disabled} {...rest}>
      <Show when={local.loading}>
        <span class={styles.spinner} />
      </Show>
      <Show when={!local.loading}>
        {local.children}
      </Show>
    </button>
  );
}
