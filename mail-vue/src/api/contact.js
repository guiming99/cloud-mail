import request from '@/utils/request'

export function getContacts(params) {
    return request({
        url: '/contacts',
        method: 'get',
        params
    })
}

export function createContact(data) {
    return request({
        url: '/contacts',
        method: 'post',
        data
    })
}

export function analyzeContact(id) {
    return request({
        url: `/contacts/${id}/ai-analysis`,
        method: 'post'
    })
}
