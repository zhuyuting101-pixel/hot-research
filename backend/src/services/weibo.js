/**
 * 微博热搜数据服务
 *
 * 接口：https://weibo.com/ajax/side/hotSearch
 * 方式：GET，返回 JSON，无需登录或 Cookie
 * 文档：无官方文档，字段来自逆向分析，变更时参考下方「字段说明」
 *
 * ─── 响应结构 ────────────────────────────────────────────────
 * {
 *   "ok": 1,
 *   "data": {
 *     "hotgov": { "word": "置顶热搜词" },   ← 置顶热搜（不计入排名）
 *     "realtime": [                          ← 实时热搜数组（排名从 0 开始）
 *       {
 *         "word":       "热搜词（不含 # 号）",  ← 用于构造 url
 *         "note":       "#热搜词#",            ← 带话题标签的完整标题，含 # 号
 *         "num":        12345678,             ← 热度数值（整数）
 *         "label_name": "新" | "沸" | "热" | "", ← 标签，可能缺失
 *         "icon_desc":  "热" | "",            ← 备用标签字段，部分条目有
 *         "flag":       0 | 1,                ← 1 = 置顶，跳过
 *         "is_ad":      0 | 1,                ← 1 = 广告，跳过
 *       }
 *     ]
 *   }
 * }
 *
 * ─── 字段映射 ────────────────────────────────────────────────
 * 本服务输出字段    ← 原始字段
 * rank             ← realtime 数组下标 + 1（过滤置顶/广告后重新编号）
 * title            ← note（优先）；note 为空时降级用 word
 * heat             ← num 格式化为「8823万」；无值时为 undefined
 * url              ← 拼接：https://s.weibo.com/weibo?q= + encodeURIComponent(word)
 *
 * ─── 日后接口变更时的修改位置 ─────────────────────────────────
 * 1. 响应路径变了（data.realtime）  → 修改 parseItems() 中的 json.data.realtime
 * 2. 标题字段改名（note/word）      → 修改 parseItems() 中的 item.note ?? item.word
 * 3. 热度字段改名（num）            → 修改 parseItems() 中的 item.num
 * 4. URL 规则变了                   → 修改 buildUrl()
 */

const WEIBO_API_URL = 'https://weibo.com/ajax/side/hotSearch'
const REQUEST_TIMEOUT_MS = 8000

// 模拟移动端浏览器，减少被拦截的概率
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
    'Version/17.0 Mobile/15E148 Safari/604.1',
  'Referer':  'https://weibo.com/',
  'Accept':   'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9',
}

// ─── 公开 API ─────────────────────────────────────────────────

/**
 * 获取微博热搜列表
 * @returns {Promise<WeiboItem[]>}
 *
 * @typedef {{ rank: number, title: string, heat?: string, url: string }} WeiboItem
 */
export async function fetchWeibo() {
  const json = await request()
  return parseItems(json)
}

// ─── 请求 ─────────────────────────────────────────────────────

async function request() {
  let res
  try {
    res = await fetch(WEIBO_API_URL, {
      headers: HEADERS,
      signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    // 网络层错误：DNS 解析失败、超时、连接拒绝等
    throw new Error(`[weibo] 请求失败：${err.message}`)
  }

  if (!res.ok) {
    throw new Error(`[weibo] HTTP ${res.status}，接口可能需要登录或已变更`)
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('[weibo] 响应不是有效 JSON，接口结构可能已变更')
  }

  // ok 字段：微博接口约定 1 = 成功
  if (json.ok !== 1) {
    throw new Error(`[weibo] 接口返回异常，ok=${json.ok}`)
  }

  return json
}

// ─── 解析 ─────────────────────────────────────────────────────

/**
 * 解析原始 JSON → WeiboItem[]
 * 跳过置顶（flag === 1）和广告（is_ad === 1）条目
 */
function parseItems(json) {
  // 解析路径：data.realtime（见顶部字段说明）
  const realtime = json?.data?.realtime
  if (!Array.isArray(realtime) || realtime.length === 0) {
    throw new Error('[weibo] data.realtime 字段缺失或为空，接口结构可能已变更')
  }

  const items = []
  let rank = 1

  for (const item of realtime) {
    // 跳过置顶（flag=1）和广告（is_ad=1）
    if (item.flag === 1 || item.is_ad === 1) continue

    items.push({
      rank,
      title: buildTitle(item),   // ← note 或 word，见字段映射
      heat:  buildHeat(item),    // ← num，格式化为「8823万」
      url:   buildUrl(item),     // ← 拼接 s.weibo.com 搜索链接
    })

    rank++
  }

  if (items.length === 0) {
    throw new Error('[weibo] 解析后条目为空，疑似结构变更或全部被过滤')
  }

  return items
}

// ─── 字段构造辅助函数 ─────────────────────────────────────────

/**
 * 标题：优先用 note（含话题 # 号），降级用 word
 * 日后修改点：item.note / item.word
 */
function buildTitle(item) {
  const raw = item.note || item.word || ''
  return raw.replace(/^#+|#+$/g, '').trim() // 去掉首尾 # 号
}

/**
 * 热度：来自 num 字段（整数）
 * 日后修改点：item.num
 */
function buildHeat(item) {
  const num = item.num
  if (typeof num !== 'number' || num <= 0) return undefined
  if (num >= 1e8) return `${(num / 1e8).toFixed(1)}亿`
  if (num >= 1e4) return `${Math.round(num / 1e4)}万`
  return String(num)
}

/**
 * URL：用 word 字段拼接微博搜索链接
 * 规律来自多个独立来源交叉验证：
 *   https://s.weibo.com/weibo?q=#热搜词#
 * 日后修改点：此函数的 base URL 和拼接规则
 */
function buildUrl(item) {
  const word = item.word || ''
  return `https://s.weibo.com/weibo?q=${encodeURIComponent(`#${word}#`)}`
}
