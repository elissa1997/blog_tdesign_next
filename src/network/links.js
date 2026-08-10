import { instance_api } from '@/network/axios.js'

export function add(data) {
    return instance_api({
        url: import.meta.env.VITE_APP_API+'/friendlink/add',
        method: 'post',
        data,
        auth: false,
    })
}
export function listFront(params) {
    return instance_api({
        url: import.meta.env.VITE_APP_API+'/friendlink/list',
        method: 'get',
        params,
        auth: false,
    })
}

export function listAdmin(params) {
    return instance_api({
        url: import.meta.env.VITE_APP_API+'/friendlink/admin-list',
        method: 'get',
        params,
        auth: true,
    })
}

export function update(data) {
    return instance_api({
        url: import.meta.env.VITE_APP_API+'/friendlink/update',
        method: 'post',
        data,
        auth: true,
    })
}

export function del(data) {
    return instance_api({
        url: import.meta.env.VITE_APP_API+'/friendlink/delete',
        method: 'post',
        data,
        auth: true,
    })
}
