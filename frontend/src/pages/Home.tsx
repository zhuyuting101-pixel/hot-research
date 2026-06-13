/**
 * Home 页面
 *
 * 数据策略：
 *   - 通过 fetchAllHot() 获取各平台榜单
 *   - weibo 始终请求真实后端，其他平台根据 VITE_USE_MOCK 决定
 *   - 加载中展示骨架屏，失败展示错误提示
 */

import { useState, useEffect } from 'react'
import type { HotPlatform, PlatformId } from '@/types/hot'
import { fetchAllHot } from '@/api/hot'
import { HotCard } from '@/components/HotCard'
import { CardSkeleton } from '@/components/Skeleton'
import styles from './Home.module.css'

// ─── 平台展示名映射 ───────────────────────────────────────────

const PLATFORM_LABELS: Record<string, { sourceName: string; listName: string }> = {
  weibo:    { sourceName: '微博',     listName: '热搜榜'   },
  baidu:    { sourceName: '百度',     listName: '实时热点' },
  bilibili: { sourceName: '哔哩哔哩', listName: '全站日榜' },
}

const getFallbackLabel = (platform: PlatformId) => ({
  sourceName: platform,
  listName:   '热榜',
})

// ─── 页面组件 ─────────────────────────────────────────────────

export function Home() {
  const [platforms, setPlatforms] = useState<HotPlatform[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetchAllHot()
      .then(data => {
        setPlatforms(data)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : '加载失败，请稍后重试')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className={styles.page}>

      {/* ── 顶栏 ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandDot} aria-hidden="true" />
            <h1 className={styles.brandName}>迷你今日热榜</h1>
          </div>
          <p className={styles.tagline}>
            一处聚合全网热搜，告别平台间反复切换
          </p>
        </div>
      </header>

      {/* ── 主区域 ── */}
      <main className={styles.main}>

        {/* 错误提示 */}
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.grid}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : platforms.map(platform => {
                const label =
                  PLATFORM_LABELS[platform.platform] ??
                  getFallbackLabel(platform.platform)

                return (
                  <HotCard
                    key={platform.platform}
                    data={platform}
                    sourceName={label.sourceName}
                    listName={label.listName}
                  />
                )
              })
          }
        </div>

      </main>

      {/* ── 页脚 ── */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          迷你今日热榜 &nbsp;·&nbsp; 学习项目，非商业用途
        </p>
        <p className={styles.footerSub}>
          数据来源于各平台公开榜单，仅作学习与技术探索使用，不用于任何商业目的。
        </p>
      </footer>

    </div>
  )
}
