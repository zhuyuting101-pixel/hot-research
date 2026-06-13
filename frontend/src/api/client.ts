/**
 * API 客户端基础封装
 * 生产环境指向 Next.js API Routes，开发环境使用 Mock 数据
 */

export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new ApiError(res.status, `API ${path} returned ${res.status}`)
  }
  return res.json() as Promise<T>
}
