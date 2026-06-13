/**
 * 百度热搜数据服务
 *
 * 接口：https://top.baidu.com/api/board?tab=realtime
 * 方式：GET，返回 JSON，无需登录，无需 Cookie
 * 文档：无官方文档，字段来自逆向分析，变更时参考下方「字段说明」
 *
 * ─── 响应结构 ────────────────────────────────────────────────
 * {
 *   "data": {
 *     "cards": [
 *       {
 *         "content": [          ← 热搜条目数组
 *           {
 *             "word":      "热搜词",        ← 标题
 *             "hotScore":  "1234567",       ← 热度数值（字符串）
 *             "show":      ["...", "..."],   ← 额外展示信息（可能含热度标签）
 *             "rawName":   "热搜词",        ← 原始词（同 word，备用）
 *             "img":       "https://...",   ← 配图（不使用）
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * ─── 字段映射 ────────────────────────────────────────────────
 * 本服务输出字段    ← 原始字段
 * rank             ← content 数组下标 + 1
 * title            ← word
 * heat             ← hotScore 格式化（如「1234万」）
 * url              ← 拼接：https://www.baidu.com/s?wd={word}
 *
 * ─── 日后接口变更时的修改位置 ─────────────────────────────────
 * 1. 接口路径变了                  → 修改 BAIDU_API_URL
 * 2. 响应路径变了（data.cards[0].content）→ 修改 parseItems()
 * 3. 标题字段改名（word）           → 修改 buildTitle()
 * 4. 热度字段改名（hotScore）       → 修改 buildHeat()
 */

const BAIDU_API_URL = 'https://top.baidu.com/api/board?tab=realtime'
const REQUEST_TIMEOUT_MS = 8000

// 模拟桌面端浏览器，带 Referer 减少被拦截概率
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/124.0.0.0 Safari/537.36',
  'Referer':       'https://top.baidu.com/',
  'Accept':        'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9',
}

// ─── 公开 API ─────────────────────────────────────────────────

/**
 * 获取百度热搜列表
 * @returns {Promise<BaiduItem[]>}
 *
 * @typedef {{ rank: number, title: string, heat?: string, url: string }} BaiduItem
 */
export async function fetchBaidu() {
  const json = await request()
  return parseItems(json)
}

// ─── 请求 ─────────────────────────────────────────────────────

async function request() {
  let res
  try {
    res = await fetch(BAIDU_API_URL, {
      headers: HEADERS,
      signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new Error(`[baidu] 请求失败：${err.message}`)
  }

  if (!res.ok) {
    throw new Error(`[baidu] HTTP ${res.status}，接口可能已变更`)
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('[baidu] 响应不是有效 JSON，接口结构可能已变更')
  }

  return json
}

// ─── 解析 ─────────────────────────────────────────────────────

/**
 * 解析原始 JSON → BaiduItem[]
 */
function parseItems(json) {
  // 解析路径：data.cards[0].content（见顶部字段说明）
  // 日后修改点：json.data?.cards?.[0]?.content
  const content = json?.data?.cards?.[0]?.content

  if (!Array.isArray(content) || content.length === 0) {
    throw new Error('[baidu] data.cards[0].content 字段缺失或为空，接口结构可能已变更')
  }

  return content.map((item, i) => ({
    rank:  i + 1,
    title: buildTitle(item),  // ← word
    heat:  buildHeat(item),   // ← hotScore
    url:   buildUrl(item),    // ← 拼接百度搜索链接
  }))
}

// ─── 字段构造辅助函数 ─────────────────────────────────────────

/**
 * 标题：来自 word 字段
 * 日后修改点：item.word
 */
function buildTitle(item) {
  return (item.word ?? item.rawName ?? '').trim()
}

/**
 * 热度：来自 hotScore 字段（字符串形式的数字）
 * 日后修改点：item.hotScore
 */
function buildHeat(item) {
  const raw = item.hotScore
  if (!raw) return undefined
  const num = parseInt(raw, 10)
  if (!Number.isFinite(num) || num <= 0) return undefined
  if (num >= 1e8) return `${(num / 1e8).toFixed(1)}亿`
  if (num >= 1e4) return `${Math.round(num / 1e4)}万`
  return String(num)
}

/**
 * URL：用 word 拼接百度搜索链接
 * 日后修改点：此函数的 base URL 和拼接规则
 */
function buildUrl(item) {
  const word = item.word ?? item.rawName ?? ''
  if (!word) return 'https://www.baidu.com'
  return `https://www.baidu.com/s?wd=${encodeURIComponent(word)}`
}
