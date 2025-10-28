export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

export function validateEmailDomain(email: string): boolean {
  const domain = email.split('@')[1];
  const blockedDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
  return !blockedDomains.includes(domain);
}
