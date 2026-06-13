/**
 * 全局类型定义
 * 来源：技术设计文档 v0.1 § 三、数据模型
 * 注意：此文件是系统契约，禁止在未同步消费方的情况下修改字段名或类型
 */

// ─── 基础枚举 ────────────────────────────────────────────────

export type PlatformId = 'weibo' | 'baidu' | 'bilibili'

export type CategoryId = 'all' | 'tech' | 'ent'

// ─── 平台配置 ────────────────────────────────────────────────

export interface PlatformConfig {
  /** 平台展示名称 */
  name: string
  /** 品牌色，十六进制 */
  color: string
  /** 热度加权系数 0.0–1.0 */
  weight: number
  /** 每次采集最大条数 */
  maxItems: number
  /** 所属分类 */
  categories: CategoryId[]
}

// ─── 热搜条目 ────────────────────────────────────────────────

/**
 * HotItem：全网热点榜条目（去重合并后）
 * 对应 API GET /api/hot 的响应条目
 */
export interface HotItem {
  rank: number
  title: string
  /** 得分最高来源平台的原始跳转链接 */
  primaryUrl: string
  /** 归一化 + 加权 + 合并后的综合得分 */
  score: number
  /** 来源平台列表（跨平台合并时含多个） */
  sources: PlatformId[]
  /** 是否为多平台合并条目 */
  isMerged: boolean
  /** 是否为新上榜条目 */
  isNew: boolean
  updatedAt: string // ISO 8601
}

/**
 * HotPlatform：单平台榜单数据
 * 对应 API GET /api/platform/[id] 的响应结构
 * 也是 Vercel KV 中 platform:{id} 存储的结构
 */
export interface HotPlatform {
  platform: PlatformId
  platformName: string
  /** 品牌色，用于卡片色点 */
  platformColor: string
  items: PlatformItem[]
  /** 最后成功采集时间，ISO 8601 */
  fetchedAt: string
  /** true = 缓存兜底，数据可能过时 */
  stale: boolean
}

/**
 * PlatformItem：单平台榜单的单条条目（原始采集数据）
 */
export interface PlatformItem {
  platform: PlatformId
  /** 平台内排名，从 1 开始 */
  rank: number
  title: string
  /** 原平台跳转链接 */
  url: string
  /** 原始热度数值（部分平台有） */
  hotValue?: number
  /** 格式化展示，如 "8823万" */
  hotDisplay?: string
  /** 是否为本次刷新新上榜 */
  isNew?: boolean
  /** 热度快速上升（平台标注） */
  isHot?: boolean
  fetchedAt: string // ISO 8601
}

// ─── API 响应 ────────────────────────────────────────────────

export interface HotListResponse {
  items: HotItem[]
  generatedAt: string
  category: CategoryId
}

export interface PlatformResponse extends HotPlatform {}

export interface StatusResponse {
  platforms: PlatformStatus[]
  checkedAt: string
}

export interface PlatformStatus {
  platform: PlatformId
  status: 'ok' | 'stale' | 'error'
  lastSuccessAt: string | null
  errorMessage?: string
}

// ─── UI 状态 ─────────────────────────────────────────────────

export type FetchState = 'idle' | 'loading' | 'success' | 'error'
