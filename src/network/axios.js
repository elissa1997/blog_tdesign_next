import axios from "axios";
import {
  getToken,
  handleAuthExpired,
  redirectToLogin,
} from '@/util/auth.js'

export function instance_api(config) {
  const instance = axios.create({
    timeout: 8000,
    headers: { 'Content-Type':'application/json' }
  });

  instance.interceptors.request.use(
    config => {
      const requiresAuth = config.auth === true
      delete config.auth

      if (!requiresAuth) {
        return config
      }

      const token = getToken()
      if (!token) {
        redirectToLogin()
        const error = new Error('登录状态已过期，请重新登录')
        error.code = 'AUTH_REQUIRED'
        return Promise.reject(error)
      }

      config.headers.Authorization = `Bearer ${token}`
      return config;
    },
    err => {
      console.log(err);
      return Promise.reject(err);
    }
  );

  instance.interceptors.response.use(
    res => {
      if (res.data?.status === 401) {
        handleAuthExpired()
      }

      // 直接返回响应数据，如果状态码是 200，继续正常处理
      return res.data;
    },
    err => {
      // 如果响应有错误（非200状态码），你可以自定义错误处理逻辑
      console.error('HTTP 请求错误:', err);
      const response = err.response;
      if (err.code === 'AUTH_REQUIRED') {
        return Promise.reject(err)
      }

      // 根据状态码判断如何处理
      if (response) {
        const { status } = response;
        if (status === 401 || response.data?.status === 401) {
          handleAuthExpired()
        }

        if (status !== 200) {
          console.warn(`HTTP 请求错误: 状态码 ${status}`);
          // 你可以在这里添加其他的错误处理，比如错误提示等
        }
        // 不抛出错误，直接返回响应数据，可以在业务代码中处理
        return response.data || { success: false, message: '未知错误' }; // 返回默认数据
      } else {
        // 如果是请求错误，比如网络问题
        console.error('网络请求失败');
        return { success: false, message: '网络请求失败' }; // 返回默认数据
      }
    }
  );

  return instance(config);
}
