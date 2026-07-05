import Cookies from 'js-cookie'

// Token Cookie 的统一配置：有效期为 3 小时，全站路径可用。
const TOKEN_COOKIE_NAME = 'token'
const TOKEN_EXPIRES_DAYS = 3 / 24

// 由路由守卫注册时注入，供请求鉴权失败和响应 401 时跳转登录页。
let routerInstance

// HTTPS 环境下启用 Secure，避免 Token Cookie 通过明文 HTTP 发送。
const cookieOptions = () => ({
  expires: TOKEN_EXPIRES_DAYS,
  path: '/',
  sameSite: 'lax',
  secure: window.location.protocol === 'https:',
})

// 只允许站内绝对路径，防止 redirect 参数造成开放重定向。
const getSafeRedirect = (redirect) => (
  typeof redirect === 'string'
  && redirect.startsWith('/')
  && !redirect.startsWith('//')
    ? redirect
    : undefined
)

// 生成登录页路由，并按需携带鉴权前的目标地址。
const getLoginLocation = (redirect) => {
  const safeRedirect = getSafeRedirect(redirect)

  return {
    name: 'Login',
    ...(safeRedirect ? { query: { redirect: safeRedirect } } : {}),
    replace: true,
  }
}

// ==================== Token 基础操作 ====================

// 读取当前登录 Token，请求鉴权和路由守卫共用。
export const getToken = () => Cookies.get(TOKEN_COOKIE_NAME)

// 登录成功后保存 Token，前端有效期为 3 小时。
export const setToken = (token) => {
  Cookies.set(TOKEN_COOKIE_NAME, token, cookieOptions())
}

// 鉴权失效时清除 Token。
export const clearToken = () => {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' })
}

// ==================== 鉴权策略一：发送请求前检查 Token ====================

/**
 * 将用户跳转到登录页，并记录当前受保护地址。
 * Axios 在 auth=true 且 Token 不存在时调用此方法，同时终止本次请求。
 */
export const redirectToLogin = (redirect) => {
  if (!routerInstance || routerInstance.currentRoute.value.name === 'Login') {
    return
  }

  return routerInstance.replace(getLoginLocation(
    redirect || routerInstance.currentRoute.value.fullPath,
  ))
}

// ==================== 鉴权策略二：后端响应 status=401 ====================

/**
 * 后端判定鉴权过期时，统一清除 Token 并跳转登录页。
 * 同时支持 HTTP 状态码 401 和响应体 status=401，由 Axios 拦截器调用。
 */
export const handleAuthExpired = () => {
  clearToken()
  return redirectToLogin()
}

// ==================== 鉴权策略三：进入路由前检查 meta.auth ====================

/**
 * 注册全局路由守卫。
 * 目标路由 meta.auth=true 且 Token 不存在时，跳转登录页并保留原目标地址。
 */
export const registerAuthGuard = (router) => {
  routerInstance = router

  router.beforeEach((to) => {
    const requiresAuth = to.matched.some((record) => record.meta.auth === true)

    if (requiresAuth && !getToken()) {
      return getLoginLocation(to.fullPath)
    }

    return true
  })
}
