export interface Contact {
  id: string;
  name: string;
  email: string;
  companyId?: string;
  country?: string;
  position?: string;
  tags: string[];
  emailCount: number;
  lastContactTime?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  country?: string;
}

export interface ContactActivity {
  id: string;
  contactId: string;
  type: 'email' | 'note' | 'meeting';
  subject?: string;
  summary?: string;
  createdAt: string;
}
