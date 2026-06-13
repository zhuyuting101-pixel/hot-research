import express from 'express'
import cors from 'cors'
import { hotRouter } from './routes/hot.js'

const PORT = 3001
const ALLOWED_ORIGIN = 'http://localhost:5173'

const app = express()

// ── 中间件 ────────────────────────────────────────────────────

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
}))

app.use(express.json())

// 请求日志：打印路径
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.path}`)
  next()
})

// ── 路由 ──────────────────────────────────────────────────────

app.use('/api/hot', hotRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// ── 启动 ──────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[backend] running on http://localhost:${PORT}`)
  console.log(`[backend] CORS allowed: ${ALLOWED_ORIGIN}`)
})
