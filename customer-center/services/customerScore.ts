import type { Contact } from '../schema/contacts';

export function calculateCustomerScore(contact: Contact): number {
  let score = 50;

  if (contact.emailCount > 10) score += 20;
  if (contact.tags.includes('VIP')) score += 15;
  if (contact.tags.includes('Quoted')) score += 10;

  return Math.min(score, 100);
}

export function getCustomerAdvice(score: number) {
  if (score >= 80) return '重点客户，建议主动维护并推荐新品';
  if (score >= 60) return '持续跟进报价和需求';
  return '建议重新激活客户';
}
