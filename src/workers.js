import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestLogger } from './middleware/logger.js'
import { errorHandler } from './middleware/errors.js'
import apiService from './service/api.js'
import demoService from './service/demo.js'
import { initConfig } from './config.js'

export default {
  async fetch (request, env) {
    // 用 Workers 环境变量初始化配置
    initConfig(env)

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
    const prefix = env.HTTP_PREFIX || ''
    app.get(`${prefix}/api`, apiService)
    app.get(`${prefix}/demo`, demoService)

    // 404
    app.notFound(() => {
      return new Response('Not Found', { status: 404 })
    })

    return app.fetch(request)
  }
}
