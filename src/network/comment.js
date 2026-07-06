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

export function adminList(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/comment/admin-list',
    method: 'get',
    params,
    auth: true,
  })
}

export function updateStatus(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/comment/update',
    method: 'post',
    data,
    auth: true,
  })
}

export function del(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/comment/delete',
    method: 'post',
    data,
    auth: true,
  })
}
