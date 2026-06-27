import { instance_api } from '@/network/axios.js'
import Cookies from 'js-cookie';

export function list(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API+'/article/list',
    method: 'get',
    params
  })
}

export function detail(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API+'/article/detail',
    method: 'get',
    params
  })
}

// export function add(data) {
//   return instance_api({
//     url: import.meta.env.VITE_APP_API+'/article/add',
//     method: 'post',
//     data,
//     headers: {'Authorization': 'Bearer ' + Cookies.get('token')}
//   })
// }
//
// export function update(data) {
//   return instance_api({
//     url: import.meta.env.VITE_APP_API+'/article/update',
//     method: 'post',
//     data,
//     headers: {'Authorization': 'Bearer ' + Cookies.get('token')}
//   })
// }
//
// export function del(data) {
//   return instance_api({
//     url: import.meta.env.VITE_APP_API+'/article/delete',
//     method: 'post',
//     data,
//     headers: {'Authorization': 'Bearer ' + Cookies.get('token')}
//   })
// }