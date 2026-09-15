import { instance_api } from '@/network/axios.js'

export function login(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API+'/auth/login',
    method: 'post',
    data,
    auth: false,
  })
}

export function info() {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/auth/info',
    method: 'get',
    auth: true,
  })
}

export function list(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/user/list',
    method: 'get',
    params,
    auth: true,
  })
}

export function detail(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/user/detail',
    method: 'get',
    params,
    auth: true,
  })
}

export function add(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/user/add',
    method: 'post',
    data,
    auth: true,
  })
}

export function update(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/user/update',
    method: 'post',
    data,
    auth: true,
  })
}

export function del(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/user/delete',
    method: 'post',
    data,
    auth: true,
  })
}
