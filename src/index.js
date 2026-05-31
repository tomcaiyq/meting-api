import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestLogger } from './middleware/logger.js'
import { errorHandler } from './middleware/errors.js'
import apiService from './service/api.js'
import demoService from './service/demo.js'
import config from './config.js'

const app = new Hono()

// CORS 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400
}))

// 请求日志中间件
app.use('*', requestLogger)

// 错误处理中间件
app.use('*', errorHandler)

// 路由
app.get(`${config.http.prefix}/api`, apiService)
app.get(`${config.http.prefix}/demo`, demoService)

// 404
app.notFound(() => {
  return new Response('Not Found', { status: 404 })
})

// 导出 Hono app
export default app

// 仅在 Bun 直接运行时启动服务器
if (typeof Bun !== 'undefined') {
  const { serve } = await import('bun')
  serve({
    port: config.http.port,
    fetch: app.fetch
  })
  console.log(`HTTP server started on port ${config.http.port}`)

  // HTTPS 服务器
  if (config.https.enabled) {
    const { readFileSync } = await import('node:fs')

    if (!config.https.keyPath || !config.https.certPath) {
      console.error('HTTPS_ENABLED is true but SSL_KEY_PATH or SSL_CERT_PATH is not configured')
      process.exit(1)
    }

    let key
    let cert

    try {
      key = readFileSync(config.https.keyPath)
      cert = readFileSync(config.https.certPath)
    } catch (error) {
      console.error({ error: error.message }, 'Failed to read SSL certificate files')
      process.exit(1)
    }

    serve({
      port: config.https.port,
      tls: { key, cert },
      fetch: app.fetch
    })
    console.log(`HTTPS server started on port ${config.https.port}`)
  } else {
    console.log('HTTPS server is disabled')
  }
}
