import { instance_api } from '@/network/axios.js'

export function findByType(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/dict/findbytype',
    method: 'get',
    params,
    auth: false,
  })
}

export function list(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/dict/list',
    method: 'get',
    params,
    auth: true,
  })
}

export function add(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/dict/add',
    method: 'post',
    data,
    auth: true,
  })
}

export function update(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/dict/update',
    method: 'post',
    data,
    auth: true,
  })
}

export function del(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/dict/delete',
    method: 'post',
    data,
    auth: true,
  })
}
