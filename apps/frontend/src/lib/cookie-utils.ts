/**
 * Cookie 工具函数
 */

/**
 * 获取指定名称的cookie值
 * @param name cookie名称
 * @returns cookie值，如果不存在返回null
 */
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=')
    if (cookieName === name) {
      return decodeURIComponent(cookieValue)
    }
  }
  return null
}

/**
 * 设置cookie
 * @param name cookie名称
 * @param value cookie值
 * @param options cookie选项
 */
export function setCookie(
  name: string, 
  value: string, 
  options: {
    expires?: Date
    maxAge?: number
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  } = {}
): void {
  let cookieString = `${name}=${encodeURIComponent(value)}`
  
  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`
  }
  
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`
  }
  
  if (options.path) {
    cookieString += `; path=${options.path}`
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`
  }
  
  if (options.secure) {
    cookieString += `; secure`
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`
  }
  
  document.cookie = cookieString
}

/**
 * 删除cookie
 * @param name cookie名称
 * @param path cookie路径
 * @param domain cookie域名
 */
export function deleteCookie(name: string, path?: string, domain?: string): void {
  setCookie(name, '', {
    expires: new Date(0),
    path,
    domain
  })
}

/**
 * 获取所有cookie
 * @returns cookie对象
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {}
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  return cookies
}