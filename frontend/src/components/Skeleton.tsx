import styles from './Skeleton.module.css'

interface CardSkeletonProps {
  rows?: number
}

export function CardSkeleton({ rows = 7 }: CardSkeletonProps) {
  return (
    <div className={styles.card} aria-busy="true" aria-label="加载中">
      <div className={styles.head}>
        <div className={`${styles.pulse} ${styles.dot}`} />
        <div className={`${styles.pulse} ${styles.name}`} />
        <div className={`${styles.pulse} ${styles.time}`} />
      </div>
      <ul className={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className={styles.item}>
            <div className={`${styles.pulse} ${styles.rank}`} />
            <div className={`${styles.pulse} ${styles.title}`} style={{ width: `${60 + (i % 3) * 12}%` }} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HotListSkeleton() {
  return (
    <div className={styles.hotCard} aria-busy="true" aria-label="加载中">
      <div className={styles.head}>
        <div className={`${styles.pulse} ${styles.dot}`} />
        <div className={`${styles.pulse} ${styles.name}`} />
      </div>
      <div className={styles.hotGrid}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={styles.hotItem}>
            <div className={`${styles.pulse} ${styles.rank}`} />
            <div className={`${styles.pulse} ${styles.title}`} style={{ width: `${50 + (i % 4) * 10}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
