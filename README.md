# 迷你今日热榜

一站式聚合微博、知乎、哔哩哔哩实时热搜，学习项目，非商业用途。

```
hotsearch/
├── frontend/   React 18 + TypeScript + Vite
└── backend/    Node.js + Express
```

---

## 安装依赖

前后端各自独立安装，**分别进入目录执行**：

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

---

## 启动开发环境

前后端需要**同时运行**，各开一个终端窗口：

**终端 A — 后端**（先启动）

```bash
cd backend
npm run dev
# 输出：[backend] running on http://localhost:3001
```

**终端 B — 前端**

```bash
cd frontend
npm run dev
# 输出：VITE ready on http://localhost:3000
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。

> 前端的 `/api/*` 请求由 Vite 代理自动转发到 `http://localhost:3001`，
> 无需手动配置跨域，也不需要修改任何环境变量。

---

## 验证接口

后端启动后可单独验证：

```bash
curl http://localhost:3001/api/health
# → {"ok":true}

curl http://localhost:3001/api/hot/weibo | jq '.platform, (.items | length)'
# → "weibo"
# → 10

curl http://localhost:3001/api/hot | jq '.platforms | map(.platform)'
# → ["weibo", "zhihu", "bilibili"]

# 无效 source → 404
curl -i http://localhost:3001/api/hot/twitter
# → HTTP/1.1 404  {"error":"unknown source: twitter"}
```

---

## 环境变量

前端配置文件位于 `frontend/.env.development`，开箱即用，无需改动：

```ini
VITE_USE_MOCK=false
# /api/* 由 vite proxy 转发到 http://localhost:3001
```

如需在**不启动后端**的情况下运行前端，将上方改为：

```ini
VITE_USE_MOCK=true
```

生产部署时在 `frontend/.env.production`（或平台环境变量面板）中设置：

```ini
VITE_API_BASE=https://your-backend-domain.com
```

---

## 常见问题

### 端口被占用

**现象**

```
Error: listen EADDRINUSE: address already in use :::3001
```
或
```
Port 3000 is in use, trying another one...
```

**解决**

查找并终止占用端口的进程：

```bash
# macOS / Linux
lsof -ti :3001 | xargs kill
lsof -ti :3000 | xargs kill

# Windows（PowerShell）
netstat -ano | findstr :3001
taskkill /PID <上方输出的 PID> /F
```

也可以修改端口：

- 后端：在 `backend/src/index.js` 顶部改 `const PORT = 3001`
- 前端：在 `frontend/vite.config.ts` 的 `server.port` 修改，并同步更新 `server.proxy` 的 target

---

### 代理不生效（页面显示"加载失败"）

**常见原因一：后端未启动**

代理能转发请求，但转发目标不存在时会直接报错。
确认终端 A 的后端已经输出 `running on http://localhost:3001` 再打开前端。

**常见原因二：先开了前端再开后端**

Vite 代理在 dev server 启动时初始化，后端后起不影响代理本身，
但如果页面已经加载了错误状态，刷新浏览器即可。

**常见原因三：VITE_USE_MOCK 未关闭**

检查 `frontend/.env.development`，确认值为：

```ini
VITE_USE_MOCK=false
```

改完后**必须重启 `npm run dev`**，Vite 不会热重载 `.env` 文件。

**常见原因四：端口不一致**

`vite.config.ts` 中的代理 target 固定为 `http://localhost:3001`。
如果后端改了端口，需要同步修改 `frontend/vite.config.ts`：

```ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',  // ← 改为实际端口
    changeOrigin: true,
  },
},
```

**调试技巧**：打开浏览器 DevTools → Network，找到失败的 `/api/hot` 请求，
查看 Status 和 Response，通常能直接看出是 `ECONNREFUSED`（后端没起）
还是 `404`（路由不存在）。

---

### node --watch 不可用

`npm run dev`（后端）使用的 `node --watch` 需要 **Node.js 18+**。

```bash
node --version  # 确认 ≥ 18.0.0
```

版本过低时，改用 `nodemon` 替代：

```bash
npm install -D nodemon          # 在 backend/ 目录下
npx nodemon src/index.js
```

---

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 样式 | CSS Modules（无 Tailwind）|
| 后端框架 | Node.js + Express 4 |
| 开发代理 | Vite server.proxy |

---

## 数据来源说明

### 各平台数据获取方式

本项目通过以下各平台**公开 JSON 接口**获取实时热榜数据，不解析 HTML 页面，不使用任何需要授权的私有接口。

| 平台 | 接口地址 | 获取方式 |
|------|---------|---------|
| 微博 | `weibo.com/ajax/side/hotSearch` | 公开 JSON 接口，无需登录 |
| 知乎 | `zhihu.com/api/v3/feed/topstory/hot-lists/total` | 公开 JSON 接口，无需登录 |
| 哔哩哔哩 | `api.bilibili.com/x/web-interface/ranking/v2` | 官方开放 API |

每次请求仅读取以下字段：热搜词 / 视频标题、热度数值、跳转链接。不采集用户数据、评论内容或任何个人信息。

### 更新频率

数据在服务器端缓存，不会对来源平台发起频繁请求：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 缓存 TTL | **600 秒（10 分钟）** | 同一平台数据在 10 分钟内复用缓存 |
| 环境变量覆盖 | `CACHE_TTL=秒数` | 在 `backend/.env` 中设置可调整 TTL |
| 强制刷新 | `?refresh=1` | 开发调试用，跳过缓存重新拉取 |

> 页面上显示的「更新于 N 分钟前」反映的是数据最后一次采集的时刻。
> 缓存期内多次刷新页面，该时间不会归零，属正常现象。

### 免责声明

- **学习项目**：本项目仅用于前后端开发技术学习，不用于任何商业目的。
- **数据版权**：所有热榜数据版权归各平台（微博、知乎、哔哩哔哩）所有，本项目仅作索引展示，不存储原始内容，点击条目将跳转至原平台页面。
- **接口稳定性**：以上公开接口均为非官方文档接口，平台可能随时调整或关闭，本项目不对数据可用性作任何保证。
- **请勿滥用**：请勿将本项目代码用于高频抓取、商业数据分析或任何违反平台服务条款的用途。

---

*学习项目 · 非商业用途 · 数据来源各平台公开榜单*
