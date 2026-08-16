// Extract contact information from email headers
export function extractContactFromEmail(email) {
    if (!email) return null

    const address = email.from || email.sender || ''
    const match = address.match(/<(.+)>/)
    const emailAddress = match ? match[1] : address

    if (!emailAddress || !emailAddress.includes('@')) {
        return null
    }

    const name = match
        ? address.replace(`<${emailAddress}>`, '').trim()
        : emailAddress.split('@')[0]

    return {
        name,
        email: emailAddress,
        company: '',
        country: '',
        tags: ['Auto Imported'],
        source: 'email',
        lastContact: new Date().toISOString()
    }
}
