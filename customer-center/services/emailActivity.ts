import type { ContactActivity } from '../schema/contacts';

export function createEmailActivity(contactId: string, subject: string, summary?: string): ContactActivity {
  return {
    id: crypto.randomUUID(),
    contactId,
    type: 'email',
    subject,
    summary: summary || '',
    createdAt: new Date().toISOString()
  };
}
