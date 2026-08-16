export function extractContact(email: string) {
  const match = email.match(/(.*)<(.*)>/);

  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
      source: 'email'
    };
  }

  return {
    name: email.split('@')[0],
    email,
    source: 'email'
  };
}
