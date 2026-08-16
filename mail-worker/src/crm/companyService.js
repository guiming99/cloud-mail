export function detectCompany(email) {
    if (!email || !email.includes('@')) return null

    const domain = email.split('@')[1]
        .replace('www.', '')

    return {
        domain,
        company: domain.split('.')[0],
        source: 'email-domain'
    }
}

export function attachContactToCompany(contact, company) {
    return {
        ...contact,
        companyId: company?.domain || null
    }
}
