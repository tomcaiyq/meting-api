const toBoolean = value => {
  if (value === undefined) return false
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function createConfig (env = {}) {
  const get = (key, fallback) => env[key] || fallback
  return {
    http: {
      prefix: get('HTTP_PREFIX', ''),
      port: toNumber(get('HTTP_PORT'), 80)
    },
    https: {
      enabled: toBoolean(get('HTTPS_ENABLED')),
      port: toNumber(get('HTTPS_PORT'), 443),
      keyPath: get('SSL_KEY_PATH', ''),
      certPath: get('SSL_CERT_PATH', '')
    },
    meting: {
      url: get('METING_URL', ''),
      token: get('METING_TOKEN', 'token'),
      cookie: {
        allowHosts: get('METING_COOKIE_ALLOW_HOSTS', '')
          ? get('METING_COOKIE_ALLOW_HOSTS').split(',').map(h => h.trim().toLowerCase())
          : []
      }
    }
  }
}

const config = createConfig(typeof process !== 'undefined' ? process.env : {})

export function initConfig (env) {
  const override = createConfig(env)
  Object.assign(config, override)
}

export default config
