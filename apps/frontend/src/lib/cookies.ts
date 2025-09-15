/**
 * Cookie utility functions using manual document.cookie approach
 * Replaces js-cookie dependency for better consistency
 */

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// 获取当前环境的cookie配置
function getCookieConfig() {
  const isDevelopment = import.meta.env.MODE === 'development'
  const isHttps = window.location.protocol === 'https:'
  const hostname = window.location.hostname

  return {
    secure: isHttps,
    sameSite: 'Lax', // 使用Lax以支持跨站点导航
    // localhost不设置domain，其他域名设置为当前域名
    domain: hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname,
    isDevelopment
  }
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue ? decodeURIComponent(cookieValue) : undefined
  }
  return undefined
}

/**
 * Set a cookie with name, value, and optional max age
 */
export function setCookie(
  name: string,
  value: string,
  maxAge: number = DEFAULT_MAX_AGE
): void {
  if (typeof document === 'undefined') return

  const config = getCookieConfig()

  // 构建cookie字符串
  let cookieString = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=${config.sameSite}`

  // 添加Secure属性（仅HTTPS）
  if (config.secure) {
    cookieString += '; Secure'
  }

  // 添加Domain属性（非localhost）
  if (config.domain) {
    cookieString += `; Domain=${config.domain}`
  }

  if (config.isDevelopment) {
    console.log(`🍪 设置Cookie [${name}]:`, cookieString)
  }

  document.cookie = cookieString

  // 验证cookie是否设置成功
  if (config.isDevelopment) {
    setTimeout(() => {
      const testValue = getCookie(name)
      if (!testValue) {
        console.warn(`❌ Cookie设置失败: ${name}`)
        console.log('当前所有cookies:', document.cookie)
        debugCookies()
      } else {
        console.log(`✅ Cookie设置成功: ${name}`)
      }
    }, 10)
  }
}

/**
 * Remove a cookie by setting its max age to 0
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return

  const config = getCookieConfig()

  // 构建删除cookie的字符串
  let cookieString = `${name}=; path=/; max-age=0; SameSite=${config.sameSite}`

  // 添加Secure属性（仅HTTPS）
  if (config.secure) {
    cookieString += '; Secure'
  }

  // 添加Domain属性（非localhost）
  if (config.domain) {
    cookieString += `; Domain=${config.domain}`
  }

  if (config.isDevelopment) {
    console.log(`🗑️ 删除Cookie [${name}]:`, cookieString)
  }

  document.cookie = cookieString
}

/**
 * 调试工具：列出所有cookie
 */
export function debugCookies(): void {
  if (typeof document === 'undefined') return

  console.group('🍪 Cookie调试信息')
  console.log('当前域名:', window.location.hostname)
  console.log('当前协议:', window.location.protocol)
  console.log('所有cookies:', document.cookie)

  if (document.cookie) {
    const cookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=')
      return { name, value: decodeURIComponent(value || '') }
    })
    console.table(cookies)
  } else {
    console.log('❌ 没有找到任何cookie')
  }
  console.groupEnd()
}

/**
 * 检查特定cookie是否存在并有效
 */
export function checkCookie(name: string): boolean {
  const value = getCookie(name)
  const exists = !!value

  if (import.meta.env.MODE === 'development') {
    console.log(`Cookie检查 [${name}]:`, exists ? '✅ 存在' : '❌ 不存在', value ? `值: ${value.substring(0, 20)}...` : '')
  }

  return exists
}

/**
 * 页面加载时检查cookie持久化状态
 */
export function checkCookiePersistence(): void {
  if (typeof document === 'undefined') return

  const config = getCookieConfig()

  if (config.isDevelopment) {
    console.group('🔍 Cookie持久化检查')
    console.log('当前URL:', window.location.href)
    console.log('当前域名:', window.location.hostname)
    console.log('当前协议:', window.location.protocol)
    console.log('Cookie配置:', config)

    // 检查是否是页面刷新
    const isPageRefresh = performance.navigation?.type === 1 ||
      performance.getEntriesByType('navigation')[0]?.type === 'reload'

    console.log('是否为页面刷新:', isPageRefresh)

    if (document.cookie) {
      console.log('当前cookies:', document.cookie)
      const cookies = document.cookie.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=')
        return {
          name,
          value: value ? decodeURIComponent(value).substring(0, 50) + '...' : '',
          length: value ? decodeURIComponent(value).length : 0
        }
      })
      console.table(cookies)
    } else {
      console.warn('❌ 页面刷新后没有找到任何cookie')
    }

    console.groupEnd()
  }
}
