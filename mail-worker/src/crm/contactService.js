/**
 * CRM contact service
 * Extract contacts from incoming email metadata.
 */

export function extractContactFromEmail(mail) {
    const from = mail?.from || ''
    const match = from.match(/(.*)<(.+)>/)

    if (match) {
        return {
            name: match[1].trim().replace(/^"|"$/g, ''),
            email: match[2].trim(),
            source: 'email'
        }
    }

    if (from.includes('@')) {
        return {
            name: from.split('@')[0],
            email: from,
            source: 'email'
        }
    }

    return null
}

export function updateContactActivity(contact, mail) {
    return {
        ...contact,
        emailCount: (contact.emailCount || 0) + 1,
        lastContactTime: mail.date || new Date().toISOString()
    }
}
