/**
 * 内存缓存工具
 *
 * getCache(key)                 — 读取缓存，过期或不存在返回 null
 * setCache(key, data, ttlSec)   — 写入缓存，ttlSec 省略时用 DEFAULT_TTL
 *
 * 过期策略：
 *   - 惰性删除：getCache 时检查，过期则删除并返回 null
 *   - 定时清扫：每分钟扫描一次 store，删除所有已过期 key
 *     （防止写多读少时 store 无限增长）
 *
 * 默认 TTL：读环境变量 CACHE_TTL（秒），未设置则 600 秒（10 分钟）
 */

// ─── 常量 ─────────────────────────────────────────────────────

const DEFAULT_TTL = (() => {
  const env = parseInt(process.env.CACHE_TTL ?? '', 10)
  return Number.isFinite(env) && env > 0 ? env : 600
})()

const SWEEP_INTERVAL_MS = 60_000 // 定时清扫间隔：1 分钟

// ─── 存储 ─────────────────────────────────────────────────────

/**
 * @type {Map<string, { data: unknown, expiresAt: number }>}
 */
const store = new Map()

// ─── 核心 API ─────────────────────────────────────────────────

/**
 * 读取缓存
 * @param {string} key
 * @returns {unknown | null} 命中返回 data，过期或不存在返回 null
 */
export function getCache(key) {
  const entry = store.get(key)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    store.delete(key)   // 惰性删除
    return null
  }

  return entry.data
}

/**
 * 写入缓存
 * @param {string} key
 * @param {unknown} data
 * @param {number} [ttlSec]  过期秒数，省略时用 DEFAULT_TTL
 */
export function setCache(key, data, ttlSec) {
  const ttl = (typeof ttlSec === 'number' && ttlSec > 0)
    ? ttlSec
    : DEFAULT_TTL

  store.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
  })
}

// ─── 工具函数（可选，供路由层使用）──────────────────────────────

/** 手动删除指定 key */
export function deleteCache(key) {
  store.delete(key)
}

/** 清空全部缓存 */
export function clearCache() {
  store.clear()
}

/** 返回当前缓存条目数（含未过期） */
export function cacheSize() {
  return store.size
}

// ─── 定时清扫 ─────────────────────────────────────────────────

const sweepTimer = setInterval(() => {
  const now = Date.now()
  let removed = 0

  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key)
      removed++
    }
  }

  if (removed > 0) {
    console.log(`[cache] sweep removed ${removed} expired key(s), remaining: ${store.size}`)
  }
}, SWEEP_INTERVAL_MS)

// Node.js 进程退出时不被 timer 阻塞
sweepTimer.unref()

// ─── 启动日志 ─────────────────────────────────────────────────

console.log(`[cache] initialized — default TTL: ${DEFAULT_TTL}s, sweep every ${SWEEP_INTERVAL_MS / 1000}s`)
