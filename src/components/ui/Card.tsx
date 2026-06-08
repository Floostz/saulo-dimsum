// src/components/ui/Card.tsx
import { JSX } from "solid-js";
import styles from "./Card.module.css";

interface CardProps {
  children: JSX.Element;
  class?: string;
  padding?: "sm" | "md" | "lg" | "none";
  elevated?: boolean;
}

export default function Card(props: CardProps) {
  const cls = () => [
    styles.card,
    styles[props.padding ?? "md"],
    props.elevated && styles.elevated,
    props.class,
  ].filter(Boolean).join(" ");

  return <div class={cls()}>{props.children}</div>;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number; // percentage change
  icon: JSX.Element;
  color?: "primary" | "success" | "warning" | "info" | "gold";
  class?: string;
}

export function StatCard(props: StatCardProps) {
  const color = () => props.color ?? "primary";
  const trendPositive = () => (props.trend ?? 0) >= 0;

  return (
    <div class={[styles.statCard, styles[`stat-${color()}`], props.class].filter(Boolean).join(" ")}>
      <div class={styles.statHeader}>
        <span class={styles.statLabel}>{props.label}</span>
        <div class={[styles.statIcon, styles[`icon-${color()}`]].join(" ")}>
          {props.icon}
        </div>
      </div>
      <div class={styles.statValue}>{props.value}</div>
      {props.subValue && <div class={styles.statSub}>{props.subValue}</div>}
      {props.trend !== undefined && (
        <div class={[styles.statTrend, trendPositive() ? styles.trendUp : styles.trendDown].join(" ")}>
          <span>{trendPositive() ? "+" : ""}{props.trend.toFixed(1)}%</span>
          <span class={styles.trendLabel}>vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}
