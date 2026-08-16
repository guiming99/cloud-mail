export function calculateCustomerScore(contact) {
    let score = 50

    if (contact.emailCount > 20) score += 20
    if (contact.tags?.includes('VIP')) score += 15
    if (contact.tags?.includes('Quoted')) score += 10

    return Math.min(score, 100)
}

export function customerSuggestion(contact) {
    const score = calculateCustomerScore(contact)

    if (score >= 80) {
        return '重点维护客户，建议主动发送新品和安排会议'
    }

    if (score >= 60) {
        return '持续跟进报价和需求变化'
    }

    return '建议重新激活客户关系'
}
