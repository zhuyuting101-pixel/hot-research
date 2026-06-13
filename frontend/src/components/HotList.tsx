import type { HotItem, CategoryId } from '@/types/hot'
import { PLATFORMS } from '@/constants'
import styles from './HotList.module.css'

interface Props {
  items: HotItem[]
  category: CategoryId
}

export function HotList({ items, category }: Props) {
  const label = category === 'all' ? '全网热点榜' : `${category} 热点榜`

  return (
    <section className={styles.section} aria-label={label}>
      <div className={styles.head}>
        <span className={styles.headDot} aria-hidden="true" />
        <h2 className={styles.headTitle}>{label}</h2>
        <span className={styles.headSub}>多平台综合排序</span>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>暂无数据</p>
      ) : (
        <ul className={styles.grid}>
          {items.map(item => (
            <HotItemRow key={item.rank} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}

function HotItemRow({ item }: { item: HotItem }) {
  const maxScore = 200 // 视觉满分
  const barWidth = Math.min(100, (item.score / maxScore) * 100)

  return (
    <li className={styles.item}>
      <span className={styles.rank} aria-label={`第${item.rank}名`}>
        {item.rank <= 3
          ? ['🥇', '🥈', '🥉'][item.rank - 1]
          : item.rank}
      </span>

      <a
        href={item.primaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.title}
        title={item.title}
      >
        {item.title}
      </a>

      {/* 来源平台标签 */}
      <div className={styles.sources} aria-label="来源平台">
        {item.sources.map(src => (
          <span
            key={src}
            className={styles.sourceTag}
            style={{ borderColor: PLATFORMS[src]?.color ?? '#ccc' }}
          >
            {PLATFORMS[src]?.name ?? src}
          </span>
        ))}
      </div>

      {/* 热度条 */}
      <div className={styles.barWrap} aria-hidden="true">
        <div className={styles.bar} style={{ width: `${barWidth}%` }} />
      </div>
    </li>
  )
}
