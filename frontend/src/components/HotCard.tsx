/**
 * HotCard 组件
 *
 * 展示单个平台的热搜榜单卡片，支持：
 *  - sourceName（来源名）+ listName（榜单名）双标题
 *  - rank、title、heat（可选）条目列表
 *  - title 点击新标签跳转
 *  - 底部格式化 updatedAt「更新于 xx」
 *  - stale 数据延迟提示
 *  - 超出 CARD_DEFAULT_ROWS 时折叠 / 展开
 *  - 桌面端 flex-column 布局实现等高感
 */

import { useState, useEffect } from 'react'
import type { PlatformItem } from '@/types/hot'
import type { HotCardProps } from '@/types/hotCard'
import { CARD_DEFAULT_ROWS, STALE_THRESHOLD_MS } from '@/constants'
import styles from './HotCard.module.css'

// ─── 主组件 ──────────────────────────────────────────────────

export function HotCard({
  data,
  sourceName,
  listName,
  defaultExpanded = false,
}: HotCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const isStale =
    data.stale ||
    Date.now() - new Date(data.fetchedAt).getTime() > STALE_THRESHOLD_MS

  const relativeTime = useRelativeTime(data.fetchedAt)

  const visibleItems = expanded
    ? data.items
    : data.items.slice(0, CARD_DEFAULT_ROWS)

  const hasMore = data.items.length > CARD_DEFAULT_ROWS

  return (
    <article
      className={styles.card}
      aria-label={`${sourceName} ${listName}`}
    >
      {/* ── 卡片头部 ── */}
      <header className={styles.head}>
        <span
          className={styles.colorDot}
          style={{ background: data.platformColor }}
          aria-hidden="true"
        />
        <div className={styles.headText}>
          <span className={styles.sourceName}>{sourceName}</span>
          <span className={styles.listName}>{listName}</span>
        </div>
        {isStale && (
          <span className={styles.staleTag} role="status">
            数据可能延迟
          </span>
        )}
      </header>

      {/* ── 榜单列表 ── */}
      <div className={styles.body}>
        {data.items.length === 0 ? (
          <p className={styles.empty}>数据暂时不可用</p>
        ) : (
          <ul className={styles.list}>
            {visibleItems.map(item => (
              <HotCardRow key={item.rank} item={item} />
            ))}
          </ul>
        )}
      </div>

      {/* ── 卡片底部：展开 / 收起 + updatedAt ── */}
      <footer className={styles.foot}>
        {hasMore && (
          <button
            className={styles.toggleBtn}
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
          >
            {expanded ? '收起' : `展开全部 ${data.items.length} 条`}
            <ChevronIcon flipped={expanded} />
          </button>
        )}
        <span
          className={styles.updatedAt}
          title="数据采集时间。缓存期内（约 10 分钟）多次刷新该时间不变，属正常现象。"
        >
          更新于 {relativeTime}
        </span>
      </footer>
    </article>
  )
}

// ─── 条目行 ───────────────────────────────────────────────────

function HotCardRow({ item }: { item: PlatformItem }) {
  const heat = item.hotDisplay  // props 规范中的 heat 字段

  return (
    <li className={styles.row}>
      {/* 排名 */}
      <span
        className={
          item.rank === 1 ? styles.rank1
          : item.rank === 2 ? styles.rank2
          : item.rank === 3 ? styles.rank3
          : styles.rank
        }
        aria-label={`第 ${item.rank} 名`}
      >
        {item.rank}
      </span>

      {/* 标题：点击新标签打开 */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.title}
        title={item.title}
      >
        {item.title}
      </a>

      {/* 右侧区域：badges + heat */}
      <div className={styles.meta}>
        {item.isNew && (
          <span className={styles.badgeNew} aria-label="新上榜">新</span>
        )}
        {item.isHot && (
          <span className={styles.badgeHot} aria-label="热度上升">热</span>
        )}
        {/* heat：无值时整列隐藏 */}
        {heat != null && (
          <span className={styles.heat}>{heat}</span>
        )}
      </div>
    </li>
  )
}

// ─── 内部工具 ─────────────────────────────────────────────────

/**
 * 相对时间格式化
 * 「刚刚」/ 「N 分钟前」/ 「N 小时前」/ 具体日期时间
 */
function formatRelativeTime(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH   = Math.floor(diffMin / 60)

  if (diffMin < 1)  return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffH   < 24) return `${diffH} 小时前`

  return new Date(iso).toLocaleString('zh-CN', {
    month:  'numeric',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

/**
 * 每分钟重新计算相对时间的 hook
 *
 * 说明：返回的时间戳来自后端 fetchedAt，代表数据最后一次采集的时刻。
 * 缓存期内（默认 10 分钟）该时间戳不变，所以「更新于 N 分钟前」
 * 会随着用户停留时间增加而变化，但不会因页面刷新而归零——
 * 这是正常现象，反映的是数据本身的新鲜度，而非页面的刷新时间。
 */
function useRelativeTime(iso: string): string {
  const [label, setLabel] = useState(() => formatRelativeTime(iso))

  useEffect(() => {
    // iso 变化时立即重算（缓存失效、数据刷新）
    setLabel(formatRelativeTime(iso))

    // 每分钟更新一次显示
    const timer = setInterval(() => {
      setLabel(formatRelativeTime(iso))
    }, 60_000)

    return () => clearInterval(timer)
  }, [iso])

  return label
}

/** 展开/收起箭头图标 */
function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={[styles.chevron, flipped ? styles.chevronFlipped : ''].join(' ')}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
