import { useState } from 'react'
import type { HotPlatform, PlatformItem } from '@/types/hot'
import { CARD_DEFAULT_ROWS, STALE_THRESHOLD_MS } from '@/constants'
import styles from './PlatformCard.module.css'

interface Props {
  data: HotPlatform
  defaultExpanded?: boolean
}

export function PlatformCard({ data, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const isStale =
    data.stale ||
    Date.now() - new Date(data.fetchedAt).getTime() > STALE_THRESHOLD_MS

  const visibleItems = expanded ? data.items : data.items.slice(0, CARD_DEFAULT_ROWS)
  const hasMore = data.items.length > CARD_DEFAULT_ROWS

  const fetchTime = new Date(data.fetchedAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className={styles.card} aria-label={`${data.platformName}热搜榜`}>
      {/* 卡片头部 */}
      <div className={styles.head}>
        <span
          className={styles.dot}
          style={{ background: data.platformColor }}
          aria-hidden="true"
        />
        <span className={styles.name}>{data.platformName}</span>
        <span className={styles.time}>
          {isStale
            ? <span className={styles.stale}>数据可能延迟</span>
            : fetchTime}
        </span>
      </div>

      {/* 榜单内容 */}
      {data.items.length === 0 ? (
        <div className={styles.empty}>数据暂时不可用</div>
      ) : (
        <>
          <ul className={styles.list}>
            {visibleItems.map(item => (
              <PlatformItemRow key={item.rank} item={item} />
            ))}
          </ul>

          {hasMore && (
            <button
              className={styles.toggle}
              onClick={() => setExpanded(e => !e)}
              aria-expanded={expanded}
            >
              {expanded
                ? '收起'
                : `展开全部 ${data.items.length} 条`}
              <svg
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                aria-hidden="true"
                style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </>
      )}
    </article>
  )
}

function PlatformItemRow({ item }: { item: PlatformItem }) {
  const rankClass =
    item.rank === 1 ? styles.rank1
    : item.rank === 2 ? styles.rank2
    : item.rank === 3 ? styles.rank3
    : styles.rank

  return (
    <li className={styles.item}>
      <span className={rankClass} aria-label={`第${item.rank}名`}>
        {item.rank}
      </span>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.title}
        title={item.title}
      >
        {item.title}
      </a>
      <div className={styles.badges}>
        {item.isNew && <span className={styles.badgeNew}>新</span>}
        {item.isHot && <span className={styles.badgeHot}>热</span>}
        {item.hotDisplay && !item.isNew && !item.isHot && (
          <span className={styles.hotVal}>{item.hotDisplay}</span>
        )}
      </div>
    </li>
  )
}
