import type { Contact } from '../schema/contacts';

export function listContacts(): Contact[] {
  return [];
}

export function findContactByEmail(contacts: Contact[], email: string) {
  return contacts.find(item => item.email === email);
}

export function createContact(input: Partial<Contact>): Contact {
  return {
    id: crypto.randomUUID(),
    name: input.name || '',
    email: input.email || '',
    tags: input.tags || [],
    emailCount: 0,
    ...input,
  } as Contact;
}
