/**
 * 前端常量
 * 来源：技术设计文档 § 三、数据模型 3.6 + AGENTS.md § 五、常量
 * 所有阈值、颜色、权重修改只改此文件
 */

import type { CategoryId, PlatformConfig, PlatformId } from '@/types/hot'

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  weibo: {
    name: '微博',
    color: '#FF6B35',
    weight: 1.0,
    maxItems: 50,
    categories: ['all', 'ent'],
  },
  baidu: {
    name: '百度',
    color: '#CC0000',
    weight: 0.9,
    maxItems: 30,
    categories: ['all'],
  },
  bilibili: {
    name: '哔哩哔哩',
    color: '#00AEEC',
    weight: 0.7,
    maxItems: 100,
    categories: ['all', 'tech'],
  },
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  all: '综合',
  tech: '科技',
  ent: '娱乐',
}

export const CATEGORIES: CategoryId[] = ['all', 'tech', 'ent']

/** 平台卡片默认展示行数 */
export const CARD_DEFAULT_ROWS = 7

/** 数据超过多少秒认为 stale（30 分钟）*/
export const STALE_THRESHOLD_MS = 30 * 60 * 1000

/** SWR 轮询间隔（5 分钟）*/
export const POLL_INTERVAL_MS = 5 * 60 * 1000

/** 强调色 */
export const ACCENT_COLOR = '#E8572A'
