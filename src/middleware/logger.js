import pino from 'pino'

const logger = pino({
  level: typeof process !== 'undefined' ? (process.env.LOG_LEVEL || 'debug') : 'debug',
  transport: typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined
})

const generateRequestId = () => Math.random().toString(36).substring(7)

const requestLogger = async (c, next) => {
  const requestId = generateRequestId()
  const startTime = performance.now()
  const url = new URL(c.req.url)

  const reqInfo = {
    method: c.req.method,
    url: url.pathname,
    headers: Object.fromEntries(c.req.raw.headers)
  }

  const requestScopedLogger = logger.child({ req: reqInfo })

  c.set('logger', requestScopedLogger)
  c.set('requestId', requestId)
  c.set('error', null)

  await next()

  const responseTime = Math.round(performance.now() - startTime)

  const responseHeaders = {}
  for (const [key, value] of c.res.headers.entries()) {
    responseHeaders[key] = value
  }

  const bindings = {
    reqId: requestId,
    res: {
      status: c.res.status,
      headers: responseHeaders
    },
    responseTime
  }

  const error = c.get('error')
  const level = error ? 'error' : 'info'
  const message = error?.message || 'Request completed'

  requestScopedLogger[level](bindings, message)
}

export {
  requestLogger,
  logger
}
