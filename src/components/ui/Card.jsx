import styles from "./Card.module.css";
export default function Card(props) {
    const cls = () => [
        styles.card,
        styles[props.padding ?? "md"],
        props.elevated && styles.elevated,
        props.class,
    ].filter(Boolean).join(" ");
    return <div class={cls()}>{props.children}</div>;
}
export function StatCard(props) {
    const color = () => props.color ?? "primary";
    const trendPositive = () => (props.trend ?? 0) >= 0;
    return (<div class={[styles.statCard, styles[`stat-${color()}`], props.class].filter(Boolean).join(" ")}>
      <div class={styles.statHeader}>
        <span class={styles.statLabel}>{props.label}</span>
        <div class={[styles.statIcon, styles[`icon-${color()}`]].join(" ")}>
          {props.icon}
        </div>
      </div>
      <div class={styles.statValue}>{props.value}</div>
      {props.subValue && <div class={styles.statSub}>{props.subValue}</div>}
      {props.trend !== undefined && (<div class={[styles.statTrend, trendPositive() ? styles.trendUp : styles.trendDown].join(" ")}>
          <span>{trendPositive() ? "+" : ""}{props.trend.toFixed(1)}%</span>
          <span class={styles.trendLabel}>vs bulan lalu</span>
        </div>)}
    </div>);
}
