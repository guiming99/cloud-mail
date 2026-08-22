import { defineStore } from 'pinia'

export const useContactStore = defineStore('contact', {
  state: () => ({ contactsByAccount: {} }),
  persist: { pick: ['contactsByAccount'] },
  getters: { contacts: (state) => (accountId) => state.contactsByAccount[String(accountId)] || [] },
  actions: {
    upsert(accountId, contact) {
      const key = String(accountId)
      const list = [...(this.contactsByAccount[key] || [])]
      const i = list.findIndex(x => x.email.toLowerCase() === contact.email.toLowerCase())
      if (i >= 0) list[i] = { ...list[i], ...contact }
      else list.push(contact)
      this.contactsByAccount[key] = list
    }
  }
})
