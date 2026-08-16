import { defineStore } from 'pinia'

export const useContactStore = defineStore('contact', {
    state: () => ({
        contacts: [
            {
                id: 1,
                name: 'John Smith',
                email: 'john@example.com',
                company: 'ABC Motorcycle',
                country: 'Mexico',
                position: 'Purchasing Manager',
                tags: ['VIP', 'Quoted'],
                lastContact: '2026-08-15',
                emailCount: 28,
                notes: ''
            }
        ],
        selected: null
    }),
    actions: {
        add(contact) {
            this.contacts.push({
                id: Date.now(),
                tags: [],
                emailCount: 0,
                ...contact
            })
        },
        select(contact) {
            this.selected = contact
        }
    }
})
