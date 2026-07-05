import { instance_api } from '@/network/axios.js'

export function login(data) {
  return instance_api({
    url: import.meta.env.VITE_APP_API+'/auth/login',
    method: 'post',
    data,
    auth: false,
  })
}
