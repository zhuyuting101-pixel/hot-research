/**
 * HotCard 组件专用类型
 *
 * 说明：HotPlatform 是系统契约类型（禁止修改字段名），
 * HotCard 所需的额外展示字段（sourceName、listName、heat）
 * 通过独立的 HotCardProps 接口注入，不污染核心类型。
 */

import type { HotPlatform, PlatformItem } from './hot'

/** 单条榜单条目（HotCard 视图层，扩展自 PlatformItem） */
export interface HotCardItem extends PlatformItem {
  /**
   * 热度展示值（对应 hotDisplay）。
   * 命名遵循 props 规范（heat），内部读取 item.hotDisplay。
   * 无值时隐藏热度列。
   */
  heat?: string
}

/** HotCard 组件 Props */
export interface HotCardProps {
  /** 底层平台数据（系统契约类型，只读） */
  data: HotPlatform
  /**
   * 数据来源名称，如「微博」「知乎热榜」
   * 独立于 data.platformName，允许调用方自定义展示名
   */
  sourceName: string
  /**
   * 榜单名称，如「热搜榜」「实时热点」
   * 作为副标题展示在 sourceName 下方
   */
  listName: string
  /** 是否默认展开全部条目（超过 CARD_DEFAULT_ROWS 时生效） */
  defaultExpanded?: boolean
}
