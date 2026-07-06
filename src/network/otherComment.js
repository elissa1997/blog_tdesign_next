import { instance_api } from '@/network/axios.js'

export function adminList(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/othercomment/admin-list',
    method: 'get',
    params,
    auth: true,
  })
}

export function updateStatus(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/othercomment/update',
    method: 'post',
    data,
    auth: true,
  })
}

export function del(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/othercomment/delete',
    method: 'post',
    data,
    auth: true,
  })
}
