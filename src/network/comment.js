import { instance_api } from '@/network/axios.js'

export function list(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/comment/list',
    method: 'get',
    params,
    auth: false,
  })
}

export function add(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/comment/add',
    method: 'post',
    data,
    auth: false,
  })
}
