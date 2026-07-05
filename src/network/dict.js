import { instance_api } from '@/network/axios.js'

export function findByType(params) {
  return instance_api({
    url: import.meta.env.VITE_APP_API + '/dict/findbytype',
    method: 'get',
    params,
    auth: false,
  })
}
