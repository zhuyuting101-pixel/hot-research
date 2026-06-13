/**
 * 平台 Mock 数据
 * 结构遵循技术设计文档 § 3.4 PlatformData + § 3.1 RawItem
 * fetched_at 由路由层注入（调用时传入），此处不写死时间戳
 */

/**
 * 构建单平台数据
 * @param {string} fetched_at - ISO 8601 时间戳，由调用方传入
 * @returns {Record<string, object>} 平台 id → PlatformData
 */
export function buildPlatforms(fetched_at) {
  return {

    // ── 微博 ──────────────────────────────────────────────────
    weibo: {
      platform:       'weibo',
      platform_name:  '微博',
      platform_color: '#FF6B35',
      stale:          false,
      fetched_at,
      items: [
        { platform: 'weibo', rank: 1,  title: '巴以停火协议正式签署',     url: 'https://s.weibo.com/weibo?q=%E5%B7%B4%E4%BB%A5%E5%81%9C%E7%81%AB',         hot_value: 88230000, hot_display: '8823万', is_new: false, category_tags: ['all', 'ent'], fetched_at },
        { platform: 'weibo', rank: 2,  title: '北京暴雨红色预警',         url: 'https://s.weibo.com/weibo?q=%E5%8C%97%E4%BA%AC%E6%9A%B4%E9%9B%A8',         hot_value: 52100000, hot_display: '5210万', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'weibo', rank: 3,  title: '神舟二十二号返回舱成功着陆', url: 'https://s.weibo.com/weibo?q=%E7%A5%9E%E8%88%9F%E4%BA%8C%E5%8D%81%E4%BA%8C%E5%8F%B7', hot_value: 48900000, hot_display: '4890万', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'weibo', rank: 4,  title: '某明星离婚内幕曝光',       url: 'https://s.weibo.com/weibo?q=%E7%A6%BB%E5%A9%9A%E5%86%85%E5%B9%95',         hot_value: 36200000, hot_display: '3620万', is_new: true,  category_tags: ['all', 'ent'], fetched_at },
        { platform: 'weibo', rank: 5,  title: '高考结束考生崩溃大哭',     url: 'https://s.weibo.com/weibo?q=%E9%AB%98%E8%80%83%E7%BB%93%E6%9D%9F',         hot_value: 28900000, hot_display: '2890万', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'weibo', rank: 6,  title: '国足亚洲杯出线希望渺茫',   url: 'https://s.weibo.com/weibo?q=%E5%9B%BD%E8%B6%B3%E4%BA%9A%E6%B4%B2%E6%9D%AF', hot_value: 19500000, hot_display: '1950万', is_new: false, category_tags: ['all', 'ent'], fetched_at },
        { platform: 'weibo', rank: 7,  title: '上海迪士尼新园区正式开放', url: 'https://s.weibo.com/weibo?q=%E8%BF%AA%E5%A3%AB%E5%B0%BC%E6%96%B0%E5%9B%AD%E5%8C%BA', hot_value: 16400000, hot_display: '1640万', is_new: true,  category_tags: ['all', 'ent'], fetched_at },
        { platform: 'weibo', rank: 8,  title: 'A股三大指数集体收涨',      url: 'https://s.weibo.com/weibo?q=A%E8%82%A1%E4%B8%89%E5%A4%A7%E6%8C%87%E6%95%B0', hot_value: 13200000, hot_display: '1320万', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'weibo', rank: 9,  title: 'DeepSeek R3 发布引发热议', url: 'https://s.weibo.com/weibo?q=DeepSeek+R3',                                   hot_value: 11800000, hot_display: '1180万', is_new: true,  category_tags: ['all', 'tech'],fetched_at },
        { platform: 'weibo', rank: 10, title: '五月天演唱会上海站开票',   url: 'https://s.weibo.com/weibo?q=%E4%BA%94%E6%9C%88%E5%A4%A9%E6%BC%94%E5%94%B1%E4%BC%9A', hot_value: 9600000,  hot_display: '960万',  is_new: false, category_tags: ['all', 'ent'], fetched_at },
      ],
    },

    // ── 百度 ──────────────────────────────────────────────────
    baidu: {
      platform:       'baidu',
      platform_name:  '百度',
      platform_color: '#2932E1',
      stale:          false,
      fetched_at,
      items: [
        { platform: 'baidu', rank: 1,  title: '2026高考首日作文题出炉',   url: 'https://www.baidu.com/s?wd=2026%E9%AB%98%E8%80%83%E4%BD%9C%E6%96%87%E9%A2%98', hot_value: 6230000, hot_display: '623万', is_new: false, category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 2,  title: '巴以冲突最新消息',         url: 'https://www.baidu.com/s?wd=%E5%B7%B4%E4%BB%A5%E5%86%B2%E7%AA%81',              hot_value: 5890000, hot_display: '589万', is_new: false, category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 3,  title: '北京大雨今晚几点停',       url: 'https://www.baidu.com/s?wd=%E5%8C%97%E4%BA%AC%E5%A4%A7%E9%9B%A8',              hot_value: 4120000, hot_display: '412万', is_new: false, category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 4,  title: '今日油价调整最新消息',     url: 'https://www.baidu.com/s?wd=%E6%B2%B9%E4%BB%B7%E8%B0%83%E6%95%B4',              hot_value: 3560000, hot_display: '356万', is_new: true,  category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 5,  title: '五月天演唱会上海站时间',   url: 'https://www.baidu.com/s?wd=%E4%BA%94%E6%9C%88%E5%A4%A9%E6%BC%94%E5%94%B1%E4%BC%9A', hot_value: 2980000, hot_display: '298万', is_new: false, category_tags: ['all', 'ent'], fetched_at },
        { platform: 'baidu', rank: 6,  title: '签证免签国家最新名单2026', url: 'https://www.baidu.com/s?wd=%E5%85%8D%E7%AD%BE%E5%9B%BD%E5%AE%B6',              hot_value: 2410000, hot_display: '241万', is_new: false, category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 7,  title: '退休金上调最新政策',       url: 'https://www.baidu.com/s?wd=%E9%80%80%E4%BC%91%E9%87%91%E4%B8%8A%E8%B0%83',      hot_value: 2130000, hot_display: '213万', is_new: false, category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 8,  title: 'DeepSeek R3 下载',        url: 'https://www.baidu.com/s?wd=DeepSeek+R3',                                         hot_value: 1870000, hot_display: '187万', is_new: true,  category_tags: ['all', 'tech'], fetched_at },
        { platform: 'baidu', rank: 9,  title: '高考录取分数线预测',       url: 'https://www.baidu.com/s?wd=%E9%AB%98%E8%80%83%E5%88%86%E6%95%B0%E7%BA%BF',      hot_value: 1640000, hot_display: '164万', is_new: false, category_tags: ['all'],         fetched_at },
        { platform: 'baidu', rank: 10, title: '神舟返回舱落点在哪里',     url: 'https://www.baidu.com/s?wd=%E7%A5%9E%E8%88%9F%E8%BF%94%E5%9B%9E%E8%88%B1',      hot_value: 1420000, hot_display: '142万', is_new: true,  category_tags: ['all'],         fetched_at },
      ],
    },

    bilibili: {
      platform:       'bilibili',
      platform_name:  '哔哩哔哩',
      platform_color: '#00AEEC',
      stale:          false,
      fetched_at,
      items: [
        { platform: 'bilibili', rank: 1,  title: '【纪录片】宇宙的边界究竟在哪里',     url: 'https://www.bilibili.com/video/BV1xx411c7mD', hot_value: 8920000, hot_display: '892万播', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'bilibili', rank: 2,  title: '我用 AI 复原了 100 年前的老照片',    url: 'https://www.bilibili.com/video/BV1xx411c7mE', hot_value: 6540000, hot_display: '654万播', is_new: false, category_tags: ['all', 'tech'], fetched_at },
        { platform: 'bilibili', rank: 3,  title: '2026 年最值得追的十部动漫',          url: 'https://www.bilibili.com/video/BV1xx411c7mF', hot_value: 5210000, hot_display: '521万播', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'bilibili', rank: 4,  title: '手搓一个 mini 操作系统全过程',       url: 'https://www.bilibili.com/video/BV1xx411c7mG', hot_value: 4470000, hot_display: '447万播', is_new: true,  category_tags: ['all', 'tech'], fetched_at },
        { platform: 'bilibili', rank: 5,  title: '零基础学吉他第一课',                url: 'https://www.bilibili.com/video/BV1xx411c7mH', hot_value: 3980000, hot_display: '398万播', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'bilibili', rank: 6,  title: '神舟返回直播切片合集',              url: 'https://www.bilibili.com/video/BV1xx411c7mI', hot_value: 3510000, hot_display: '351万播', is_new: true,  category_tags: ['all'],        fetched_at },
        { platform: 'bilibili', rank: 7,  title: '我在大城市的第三年月薪多少',        url: 'https://www.bilibili.com/video/BV1xx411c7mJ', hot_value: 2890000, hot_display: '289万播', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'bilibili', rank: 8,  title: 'DeepSeek R3 本地部署完整教程',      url: 'https://www.bilibili.com/video/BV1xx411c7mK', hot_value: 2540000, hot_display: '254万播', is_new: true,  category_tags: ['all', 'tech'], fetched_at },
        { platform: 'bilibili', rank: 9,  title: '高考数学压轴题解析',               url: 'https://www.bilibili.com/video/BV1xx411c7mL', hot_value: 2210000, hot_display: '221万播', is_new: false, category_tags: ['all'],        fetched_at },
        { platform: 'bilibili', rank: 10, title: '30 分钟学会 Tailwind CSS',         url: 'https://www.bilibili.com/video/BV1xx411c7mM', hot_value: 1880000, hot_display: '188万播', is_new: false, category_tags: ['all', 'tech'], fetched_at },
      ],
    },

  }
}

/** 合法的 source 列表 */
export const VALID_SOURCES = ['weibo', 'baidu', 'bilibili']
