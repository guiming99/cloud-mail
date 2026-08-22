import http from '@/axios/index.js';

export function conversationList(accountId) {
  return http.get('/conversation/list', { params: { accountId } })
}

export function conversationDetail(accountId, threadId) {
  return http.get('/conversation/detail', { params: { accountId, threadId } })
}
