/**
 * 知乎热榜数据服务
 *
 * 接口：https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=50
 * 方式：GET，返回 JSON，无需登录，无需 Cookie
 * 文档：无官方文档，字段来自逆向分析，变更时参考下方「字段说明」
 *
 * ─── 响应结构 ────────────────────────────────────────────────
 * {
 *   "data": [                            ← 热榜数组，直接位于顶层
 *     {
 *       "type":        "hot_list_feed",
 *       "debut":       false,            ← true = 新上榜
 *       "detail_text": "1080 万热度",    ← 热度展示字符串（含「万热度」后缀）
 *       "target": {
 *         "id":    3015625322,           ← 问题 ID，用于构造 web url
 *         "title": "如何看待...",        ← 热榜标题
 *         "type":  "question",
 *         "url":   "https://api.zhihu.com/questions/3015625322"  ← API 内部链接，需转换
 *       }
 *     }
 *   ],
 *   "paging": { "is_end": true }
 * }
 *
 * ─── 字段映射 ────────────────────────────────────────────────
 * 本服务输出字段    ← 原始字段
 * rank             ← data 数组下标 + 1
 * title            ← target.title
 * heat             ← detail_text（去掉「热度」后缀，保留「1080 万」）
 * url              ← target.id 拼接：https://www.zhihu.com/question/{id}
 *                    （不用 target.url，因为那是 API 内部链接，用户无法直接访问）
 * is_new           ← debut（true = 新上榜）
 *
 * ─── 日后接口变更时的修改位置 ─────────────────────────────────
 * 1. 接口地址/路径变了               → 修改 ZHIHU_API_URL 常量
 * 2. 响应路径变了（data[]）          → 修改 parseItems() 中的 json.data
 * 2. 标题字段改名（target.title）    → 修改 buildTitle()
 * 3. 热度字段改名（detail_text）     → 修改 buildHeat()
 * 4. 问题 ID 字段改名（target.id）   → 修改 buildUrl()
 * 5. 新上榜字段改名（debut）         → 修改 parseItems() 中的 item.debut
 */

const ZHIHU_API_URL = 'https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=50'
const REQUEST_TIMEOUT_MS = 8000

// 模拟桌面端浏览器（知乎移动端接口返回结构不同，保持桌面端）
// hot-list-web 接口只需标准 UA + Referer，无需 x-visitor-id
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/124.0.0.0 Safari/537.36',
  'Referer':        'https://www.zhihu.com/',
  'Accept':         'application/json, text/plain, */*',
  'Accept-Language':'zh-CN,zh;q=0.9',
}

// ─── 公开 API ─────────────────────────────────────────────────

/**
 * 获取知乎热榜列表
 * @returns {Promise<ZhihuItem[]>}
 *
 * @typedef {{ rank: number, title: string, heat?: string, url: string, is_new: boolean }} ZhihuItem
 */
export async function fetchZhihu() {
  const json = await request()
  return parseItems(json)
}

// ─── 请求 ─────────────────────────────────────────────────────

async function request() {
  let res
  try {
    res = await fetch(ZHIHU_API_URL, {
      headers: HEADERS,
      signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new Error(`[zhihu] 请求失败：${err.message}`)
  }

  if (!res.ok) {
    throw new Error(`[zhihu] HTTP ${res.status}，接口可能需要登录或已变更`)
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('[zhihu] 响应不是有效 JSON，接口结构可能已变更')
  }

  return json
}

// ─── 解析 ─────────────────────────────────────────────────────

/**
 * 解析原始 JSON → ZhihuItem[]
 */
function parseItems(json) {
  // 解析路径：data[]（顶层数组，见顶部字段说明）
  const data = json?.data
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('[zhihu] data 字段缺失或为空，接口结构可能已变更')
  }

  const items = []

  for (let i = 0; i < data.length; i++) {
    const item = data[i]

    // type 不是 hot_list_feed 的条目跳过（广告、推广等）
    if (item.type !== 'hot_list_feed') continue

    const title = buildTitle(item)
    if (!title) continue   // 标题为空则跳过，防御性处理

    items.push({
      rank:   items.length + 1,              // 过滤后重新编号
      title,
      heat:   buildHeat(item),               // ← detail_text
      url:    buildUrl(item),                // ← target.id 拼接 web url
      is_new: item.debut === true,           // ← debut
    })
  }

  if (items.length === 0) {
    throw new Error('[zhihu] 解析后条目为空，疑似结构变更或全部被过滤')
  }

  return items
}

// ─── 字段构造辅助函数 ─────────────────────────────────────────

/**
 * 标题：来自 target.title
 * 日后修改点：item.target?.title
 */
function buildTitle(item) {
  return (item.target?.title ?? '').trim()
}

/**
 * 热度：来自 detail_text（如「1080 万热度」）
 * 去掉「热度」后缀，保留「1080 万」作为展示值
 * 日后修改点：item.detail_text
 */
function buildHeat(item) {
  const raw = item.detail_text
  if (!raw || typeof raw !== 'string') return undefined
  // 去掉末尾的「热度」二字和多余空格
  return raw.replace(/热度$/, '').trim() || undefined
}

/**
 * URL：用 target.id 拼接 web 端问题链接
 * target.url 是 API 内部链接（api.zhihu.com），用户无法直接访问
 * 日后修改点：item.target?.id 及 base URL
 */
function buildUrl(item) {
  const id = item.target?.id
  if (!id) return 'https://www.zhihu.com/hot'   // 兜底
  return `https://www.zhihu.com/question/${id}`
}
