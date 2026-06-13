import type { CategoryId } from '@/types/hot'
import { CATEGORIES, CATEGORY_LABELS } from '@/constants'
import styles from './NavBar.module.css'

interface Props {
  activeTab: CategoryId
  onTabChange: (tab: CategoryId) => void
  lastUpdated?: string
}

export function NavBar({ activeTab, onTabChange, lastUpdated }: Props) {
  const time = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoDot} />
          热聚
        </div>

        {/* Tab */}
        <nav className={styles.tabs} aria-label="内容分类">
          {CATEGORIES.map(tab => (
            <button
              key={tab}
              className={[styles.tab, tab === activeTab ? styles.tabActive : ''].join(' ')}
              onClick={() => onTabChange(tab)}
              aria-current={tab === activeTab ? 'page' : undefined}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </nav>

        {/* 更新时间 */}
        {time && (
          <div className={styles.meta} aria-label={`最后更新于 ${time}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {time} 更新
          </div>
        )}
      </div>
    </header>
  )
}
