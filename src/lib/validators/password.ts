export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors = [];

  if (password.length < 12) errors.push('Mínimo 12 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos 1 maiúscula');
  if (!/[a-z]/.test(password)) errors.push('Pelo menos 1 minúscula');
  if (!/[0-9]/.test(password)) errors.push('Pelo menos 1 número');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Pelo menos 1 símbolo');

  return { valid: errors.length === 0, errors };
}
