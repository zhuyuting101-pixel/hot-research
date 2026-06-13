/**
 * 热搜相关 API
 *
 * 数据源策略：
 *   - weibo：始终请求真实后端 GET /api/hot/weibo（via vite proxy → localhost:3001）
 *   - 全部平台均由后端接口驱动，不再依赖本地 mock
 *
 * 字段映射：
 *   后端返回 snake_case（platform_name / fetched_at / hot_value …）
 *   前端类型为 camelCase（platformName / fetchedAt / hotValue …）
 *   映射统一在 normalizePlatform() 中处理，组件层无感知。
 */

import type {
  CategoryId,
  HotListResponse,
  HotPlatform,
  PlatformItem,
  PlatformId,
  StatusResponse,
} from '@/types/hot'
import { apiFetch } from './client'

// mock/hot.json 已移除直接依赖，三个平台均由后端接口驱动。
// 如需本地兜底，可在 catch 块中重新引入。

// ─── 后端响应原始类型（snake_case）────────────────────────────
// 与 TDD § 3.1 RawItem、§ 3.4 PlatformData 对齐

interface RawItemBackend {
  platform:      string
  rank:          number
  title:         string
  url:           string
  hot_value?:    number
  hot_display?:  string
  is_new?:       boolean
  category_tags?: string[]
  fetched_at:    string
}

interface PlatformDataBackend {
  platform:       string
  platform_name:  string
  platform_color: string
  items:          RawItemBackend[]
  fetched_at:     string
  stale:          boolean
}

// ─── 字段映射：snake_case → camelCase ────────────────────────

function normalizePlatform(raw: PlatformDataBackend): HotPlatform {
  return {
    platform:      raw.platform as PlatformId,
    platformName:  raw.platform_name,
    platformColor: raw.platform_color,
    fetchedAt:     raw.fetched_at,
    stale:         raw.stale,
    items:         raw.items.map(normalizeItem),
  }
}

function normalizeItem(raw: RawItemBackend): PlatformItem {
  return {
    platform:  raw.platform as PlatformId,
    rank:      raw.rank,
    title:     raw.title,
    url:       raw.url,
    fetchedAt: raw.fetched_at,
    ...(raw.hot_value   !== undefined && { hotValue:   raw.hot_value }),
    ...(raw.hot_display !== undefined && { hotDisplay: raw.hot_display }),
    ...(raw.is_new      !== undefined && { isNew:      raw.is_new }),
  }
}

// ─── fetchHotPlatform：单平台榜单 ─────────────────────────────
// source 对应后端路由段：weibo | zhihu | baidu | bilibili

export async function fetchHotPlatform(source: PlatformId): Promise<HotPlatform> {
  const raw = await apiFetch<PlatformDataBackend>(`/api/hot/${source}`)
  return normalizePlatform(raw)
}

// ─── fetchAllHot：调用后端聚合接口 GET /api/hot ─────────────
// 后端返回 { platforms: PlatformDataBackend[] }，一次请求取全部平台。
// 单平台失败由后端兜底（stale 标记），前端不需要 allSettled。

interface AllHotBackend {
  platforms: PlatformDataBackend[]
}

export async function fetchAllHot(): Promise<HotPlatform[]> {
  const { platforms } = await apiFetch<AllHotBackend>('/api/hot')
  return platforms.map(normalizePlatform)
}

// ─── fetchHotList：全网热点榜（聚合排序）─────────────────────

export async function fetchHotList(
  tab: CategoryId = 'all',
  limit = 20,
): Promise<HotListResponse> {
  return apiFetch<HotListResponse>(`/api/hot?tab=${tab}&limit=${limit}`)
}

// ─── fetchStatus：采集状态 ────────────────────────────────────

export async function fetchStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>('/api/status')
}

