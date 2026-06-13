/**
 * GET /api/hot/:source  — 单平台榜单
 * GET /api/hot          — 全平台聚合 { platforms: [...] }
 *
 * 无效 source → 404 { error: true, message: '...' }
 *
 * 缓存策略（/:source）：
 *   命中  → 直接返回，打印 [cache hit]
 *   未命中 → 调用 fetchPlatformData()，成功写缓存，失败不写
 *   ?refresh=1 → 跳过缓存强制重新拉取（仅开发用）
 *
 * GET / 并发拉取所有平台，优先读独立缓存，缓存与 /:source 共享同一套 key。
 */

import { Router } from 'express'
import { buildPlatforms, VALID_SOURCES } from '../data/platforms.js'
import { getCache, setCache } from '../utils/cache.js'
import { fetchWeibo } from '../services/weibo.js'
import { fetchBaidu }    from '../services/baidu.js'
import { fetchBilibili } from '../services/bilibili.js'

export const hotRouter = Router()

// ── 平台元信息 ────────────────────────────────────────────────

const PLATFORM_META = {
  weibo:    { platform_name: '微博',     platform_color: '#FF6B35', category_tags: ['all', 'ent']        },
  baidu:    { platform_name: '百度',     platform_color: '#2932E1', category_tags: ['all']                 },
  bilibili: { platform_name: '哔哩哔哩', platform_color: '#00AEEC', category_tags: ['all', 'tech']        },
}

// ── 核心：拉取单平台数据 ──────────────────────────────────────
//
// 返回标准 PlatformData，失败时返回带 error:true 的降级对象。
// /:source 和 GET / 均调用此函数，保证逻辑一致。

async function fetchPlatformData(source, fetched_at) {
  const meta = PLATFORM_META[source] ?? {
    platform_name:  source,
    platform_color: '#888888',
    category_tags:  ['all'],
  }

  // ── Mock 平台（bilibili 等暂未接入真实接口）────────────────
  if (source !== 'weibo' && source !== 'baidu' && source !== 'bilibili') {
    return buildPlatforms(fetched_at)[source]
  }

  // ── 真实接口平台 ───────────────────────────────────────────
  const fetcher =
    source === 'weibo'    ? fetchWeibo :
    source === 'baidu'    ? fetchBaidu :
    /* bilibili */          fetchBilibili

  const friendlyMsg =
    source === 'weibo'    ? '微博热搜暂时无法获取，请稍后再试' :
    source === 'baidu'    ? '百度热搜暂时无法获取，请稍后再试' :
    /* bilibili */          '哔哩哔哩热榜暂时无法获取，请稍后再试'

  try {
    const raw = await fetcher()

    return {
      platform:       source,
      platform_name:  meta.platform_name,
      platform_color: meta.platform_color,
      stale:          false,
      fetched_at,
      items: raw.map((item, i) => ({
        platform:      source,
        rank:          item.rank ?? i + 1,
        title:         item.title,
        url:           item.url,
        hot_value:     undefined,
        hot_display:   item.heat,
        is_new:        item.is_new ?? false,
        category_tags: meta.category_tags,
        fetched_at,
      })),
    }
  } catch (err) {
    console.error(`[${source}] 拉取失败：${err.message}`)
    return {
      error:          true,
      message:        friendlyMsg,
      platform:       source,
      platform_name:  meta.platform_name,
      platform_color: meta.platform_color,
      items:          [],
      fetched_at,
    }
  }
}

// ── GET /api/hot/:source ──────────────────────────────────────

hotRouter.get('/:source', async (req, res) => {
  const { source }   = req.params
  const forceRefresh = req.query.refresh === '1'

  if (!VALID_SOURCES.includes(source)) {
    return res.status(404).json({
      error:   true,
      message: `不支持的平台：${source}`,
    })
  }

  const cacheKey = `hot:${source}`

  // 查缓存（?refresh=1 时跳过）
  if (!forceRefresh) {
    const cached = getCache(cacheKey)
    if (cached) {
      console.log(`[cache hit]  ${cacheKey}`)
      return res.json(cached)
    }
  }

  const fetched_at = new Date().toISOString()
  const data = await fetchPlatformData(source, fetched_at)

  // 成功才写缓存（error:true 的降级数据不缓存）
  if (!data.error) {
    setCache(cacheKey, data)
    console.log(`[cache miss] ${cacheKey}${forceRefresh ? ' (forced refresh)' : ''}`)
  }

  return res.json(data)
})

// ── GET /api/hot ──────────────────────────────────────────────
//
// 并发拉取所有平台：
//   1. 优先读各平台独立缓存（key: hot:{source}），命中则直接复用
//   2. 未命中则调用 fetchPlatformData()，成功写回独立缓存
//   3. 失败平台带 error:true，不影响其他平台
// 缓存与 /:source 共享同一套 key，两个路由的缓存互通。

hotRouter.get('/', async (_req, res) => {
  const results = await Promise.allSettled(
    VALID_SOURCES.map(async source => {
      const cacheKey = `hot:${source}`

      // 优先读独立缓存（与 /:source 共享）
      const cached = getCache(cacheKey)
      if (cached) {
        console.log(`[cache hit]  ${cacheKey} (from GET /)`)
        return cached
      }

      // 未命中：拉取，fetched_at 由本次请求时间决定
      const fetched_at = new Date().toISOString()
      const data = await fetchPlatformData(source, fetched_at)

      // 成功才写缓存
      if (!data.error) {
        setCache(cacheKey, data)
        console.log(`[cache miss] ${cacheKey} (from GET /)`)
      }

      return data
    })
  )

  const platforms = results.map((result, i) => {
    const source = VALID_SOURCES[i]
    if (result.status === 'fulfilled') {
      return result.value
    }
    // fetchPlatformData 内部已 catch，走到这里属于极罕见未预期异常
    console.error(`[${source}] 未预期错误：${result.reason}`)
    const meta = PLATFORM_META[source] ?? {}
    return {
      error:          true,
      message:        '数据获取失败，请稍后再试',
      platform:       source,
      platform_name:  meta.platform_name ?? source,
      platform_color: meta.platform_color ?? '#888888',
      items:          [],
      fetched_at:     new Date().toISOString(),
    }
  })

  res.json({ platforms })
})
