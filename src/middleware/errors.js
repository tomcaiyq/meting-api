import { logger as baseLogger } from './logger.js'

export async function errorHandler (c, next) {
  try {
    await next()
  } catch (err) {
    if (err?.kind === 'ObjectId') {
      err.status = 404
    }
    const status = err.status || 500

    const requestLogger = c.get('logger') ?? baseLogger
    const url = new URL(c.req.url)

    const logPayload = {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        status
      },
      request: {
        method: c.req.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        userAgent: c.req.raw.headers.get('user-agent'),
        ip: c.req.raw.headers.get('x-forwarded-for') || c.req.raw.headers.get('x-real-ip') || 'unknown'
      }
    }

    const requestId = c.get('requestId')
    if (requestId) {
      logPayload.request.requestId = requestId
    }

    requestLogger.error(logPayload, 'Request error occurred')

    c.header('x-error-message', encodeURIComponent(err.message))
    c.set('error', err)

    return c.text('服务器未知异常', status)
  }
}
