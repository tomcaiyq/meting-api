import config from '../config.js'

// Cookie 缓存
const cookieCache = new Map()
const COOKIE_TTL = 1000 * 60 * 5 // 5分钟缓存过期

// 仅在 Node.js/Bun 环境下启动文件监听
let watcher = null
if (typeof process !== 'undefined') {
  try {
    const { watch } = await import('node:fs/promises')
    const { resolve } = await import('node:path')
    const cookieDir = resolve(process.cwd(), 'cookie')

    async function startWatcher () {
      try {
        watcher = watch(cookieDir)
        for await (const event of watcher) {
          if (event.filename) {
            cookieCache.delete(event.filename)
          }
        }
      } catch {
        // 监听失败不影响正常运行
      }
    }

    startWatcher().catch(() => {})
  } catch {
    // 非 Node.js 环境（如 Cloudflare Workers），跳过文件监听
  }
}

/**
 * 读取指定平台的 cookie
 * @param {string} server - 平台名称 (netease, tencent 等)
 * @returns {Promise<string>} cookie 字符串，失败时返回空字符串
 */
export async function readCookieFile (server) {
  const now = Date.now()
  const cached = cookieCache.get(server)

  // 检查缓存是否有效
  if (cached && now - cached.timestamp < COOKIE_TTL) {
    return cached.value
  }

  // 优先从环境变量读取
  const envKey = `METING_COOKIE_${server.toUpperCase()}`
  const envCookie = typeof process !== 'undefined'
    ? process.env[envKey]
    : undefined
  if (envCookie) {
    const value = envCookie.trim()
    cookieCache.set(server, { value, timestamp: now })
    return value
  }

  // 从文件读取（仅 Node.js/Bun 环境）
  if (typeof process !== 'undefined') {
    try {
      const { readFile } = await import('node:fs/promises')
      const { resolve } = await import('node:path')
      const cookiePath = resolve(process.cwd(), 'cookie', server)
      const cookie = await readFile(cookiePath, 'utf-8')
      const value = cookie.trim()
      cookieCache.set(server, { value, timestamp: now })
      return value
    } catch {
      cookieCache.set(server, { value: '', timestamp: now })
      return ''
    }
  }

  return ''
}

/**
 * 验证 referrer 是否在允许的主机列表中
 * @param {string} referrer - 请求的 referrer
 * @returns {boolean} 是否允许
 */
export function isAllowedHost (referrer) {
  if (config.meting.cookie.allowHosts.length === 0) return true
  if (!referrer) return false

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()
    return config.meting.cookie.allowHosts.includes(hostname)
  } catch {
    return false
  }
}
