import { instance_api } from '@/network/axios.js'

// 必应每日一图接口
export function bingPic(params) {
  return instance_api({
    url: import.meta.env.VITE_PROXY_BING + '/HPImageArchive.aspx',
    method: 'get',
    params,
    auth: false,
  })
}
