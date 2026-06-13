/**
 * 哔哩哔哩全站日榜数据服务
 *
 * 接口：https://api.bilibili.com/x/web-interface/ranking/v2
 * 方式：GET，官方开放接口，需携带 buvid3 Cookie（通过首页 Set-Cookie 动态获取）
 * 参数：rid=0（全站），type=all
 * 文档：https://github.com/SocialSisterYi/bilibili-API-collect
 *
 * ─── 响应结构 ────────────────────────────────────────────────
 * {
 *   "code": 0,               ← 0 = 成功，非 0 = 失败
 *   "message": "0",
 *   "data": {
 *     "list": [              ← 热门视频数组，通常 100 条
 *       {
 *         "bvid":    "BV1xx411c7mD",   ← 视频唯一标识，构造 URL 用
 *         "title":   "视频标题",        ← 标题
 *         "tname":   "出行",            ← 分区名称（如生活、科技、游戏）
 *         "owner": {
 *           "name": "UP主名称"          ← UP 主昵称，附加在 heat 里展示
 *         },
 *         "stat": {
 *           "view":    2465053,         ← 播放量（整数），用于 heat 展示
 *           "like":    403250,          ← 点赞数（备用）
 *           "danmaku": 8467            ← 弹幕数（备用）
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * ─── 字段映射 ────────────────────────────────────────────────
 * 本服务输出字段    ← 原始字段
 * rank             ← list 数组下标 + 1
 * title            ← title
 * heat             ← stat.view 格式化（如「892万播」）
 * url              ← bvid 拼接：https://www.bilibili.com/video/{bvid}
 *
 * ─── 日后接口变更时的修改位置 ─────────────────────────────────
 * 1. 响应路径变了（data.list）      → 修改 parseItems() 中的 json.data?.list
 * 2. 接口成功码变了（code === 0）   → 修改 request() 中的 json.code !== 0
 * 3. 标题字段改名（title）          → 修改 buildTitle()
 * 4. 播放量字段改名（stat.view）    → 修改 buildHeat()
 * 5. 视频 ID 字段改名（bvid）       → 修改 buildUrl()
 */

const BILIBILI_HOME_URL  = 'https://www.bilibili.com/'
const BILIBILI_API_URL   = 'https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all'
const REQUEST_TIMEOUT_MS = 8000

// B 站自 2023 年起，ranking/v2 需要携带 buvid3 Cookie
// 通过先 GET 首页从 Set-Cookie 获取，无需登录
const BASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/124.0.0.0 Safari/537.36',
  'Referer':        'https://www.bilibili.com/',
  'Accept':         'application/json, text/plain, */*',
  'Accept-Language':'zh-CN,zh;q=0.9',
}

// ─── buvid3 缓存（进程级，避免每次都请求首页）───────────────
let _cachedBuvid3 = ''
let _buvidFetchedAt = 0
const BUVID_CACHE_MS = 12 * 60 * 60 * 1000  // 12 小时重新获取

async function getBuvid3() {
  if (_cachedBuvid3 && Date.now() - _buvidFetchedAt < BUVID_CACHE_MS) {
    return _cachedBuvid3
  }
  try {
    // 日后修改点：从首页 Set-Cookie 取 buvid3
    const res = await fetch(BILIBILI_HOME_URL, {
      headers: BASE_HEADERS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const setCookie = res.headers.get('set-cookie') ?? ''
    const match = setCookie.match(/buvid3=([^;]+)/)
    if (match) {
      _cachedBuvid3 = match[1]
      _buvidFetchedAt = Date.now()
    }
  } catch {
    // 取不到 buvid3 时静默降级，直接请求（部分情况仍可用）
  }
  return _cachedBuvid3
}

// ─── 公开 API ─────────────────────────────────────────────────

/**
 * 获取哔哩哔哩全站日榜列表
 * @param {number} [limit=50] 返回条数上限
 * @returns {Promise<BilibiliItem[]>}
 *
 * @typedef {{ rank: number, title: string, heat?: string, url: string }} BilibiliItem
 */
export async function fetchBilibili(limit = 50) {
  const json = await request()
  return parseItems(json, limit)
}

// ─── 请求 ─────────────────────────────────────────────────────

async function request() {
  const buvid3 = await getBuvid3()
  const headers = {
    ...BASE_HEADERS,
    ...(buvid3 ? { 'Cookie': `buvid3=${buvid3}` } : {}),
  }

  let res
  try {
    res = await fetch(BILIBILI_API_URL, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new Error(`[bilibili] 请求失败：${err.message}`)
  }

  if (!res.ok) {
    throw new Error(`[bilibili] HTTP ${res.status}，接口可能已变更`)
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('[bilibili] 响应不是有效 JSON，接口结构可能已变更')
  }

  // B 站接口约定：code === 0 为成功
  // 日后修改点：json.code !== 0
  if (json.code !== 0) {
    throw new Error(`[bilibili] 接口返回异常，code=${json.code}，message=${json.message}`)
  }

  return json
}

// ─── 解析 ─────────────────────────────────────────────────────

/**
 * 解析原始 JSON → BilibiliItem[]
 */
function parseItems(json, limit) {
  // 解析路径：data.list（见顶部字段说明）
  const list = json?.data?.list
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('[bilibili] data.list 字段缺失或为空，接口结构可能已变更')
  }

  return list.slice(0, limit).map((item, i) => ({
    rank:  i + 1,
    title: buildTitle(item),   // ← title
    heat:  buildHeat(item),    // ← stat.view
    url:   buildUrl(item),     // ← bvid
  }))
}

// ─── 字段构造辅助函数 ─────────────────────────────────────────

/**
 * 标题：来自 title 字段
 * 日后修改点：item.title
 */
function buildTitle(item) {
  return (item.title ?? '').trim()
}

/**
 * 热度：来自 stat.view（播放量整数），格式化为「892万播」
 * 日后修改点：item.stat?.view
 */
function buildHeat(item) {
  const view = item.stat?.view
  if (typeof view !== 'number' || view <= 0) return undefined
  if (view >= 1e8) return `${(view / 1e8).toFixed(1)}亿播`
  if (view >= 1e4) return `${Math.round(view / 1e4)}万播`
  return `${view}播`
}

/**
 * URL：用 bvid 拼接视频页面链接
 * 日后修改点：item.bvid 及 base URL
 */
function buildUrl(item) {
  const bvid = item.bvid
  if (!bvid) return 'https://www.bilibili.com/v/popular/all'  // 兜底
  return `https://www.bilibili.com/video/${bvid}`
}
