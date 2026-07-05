import { instance_api } from '@/network/axios.js'

export function list(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API+'/article/list',
    method: 'get',
    params,
    auth: false,
  })
}

export function detail(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API+'/article/detail',
    method: 'get',
    params,
    auth: false,
  })
}

// export function add(data) {
//   return instance_api({
//     url: import.meta.env.VITE_APP_API+'/article/add',
//     method: 'post',
//     data,
//     auth: true,
//   })
// }
//
// export function update(data) {
//   return instance_api({
//     url: import.meta.env.VITE_APP_API+'/article/update',
//     method: 'post',
//     data,
//     auth: true,
//   })
// }
//
// export function del(data) {
//   return instance_api({
//     url: import.meta.env.VITE_APP_API+'/article/delete',
//     method: 'post',
//     data,
//     auth: true,
//   })
// }
