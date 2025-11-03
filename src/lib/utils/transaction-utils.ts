/**
 * Utilitários para formatação de transações
 */

/**
 * Limpa a descrição da transação removendo IDs técnicos e informações redundantes
 * Mantém apenas o texto legível para o usuário
 */
export function cleanTransactionDescription(description: string): string {
  if (!description) return '';
  
  return description
    // Remove IDs técnicos entre parênteses (cmhe46m4t003pxv7a1u88vf3e)
    .replace(/\s*\(cmh[a-z0-9]+\)/gi, '')
    // Remove informações de "para quem" que já aparecem em outro lugar
    .replace(/\s*\(para\s+[^)]+\)/gi, '')
    // Remove emojis duplicados no início
    .replace(/^(💸|💰)\s*(Pagamento|Recebimento)\s*-\s*/gi, '$2 - ')
    // Remove espaços extras
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formata o nome do participante de uma transação compartilhada
 */
export function formatParticipantName(name: string): string {
  if (!name) return '';
  
  // Remove prefixos técnicos
  return name
    .replace(/^(para|de)\s+/gi, '')
    .trim();
}

/**
 * Obtém uma descrição curta da transação (máximo de caracteres)
 */
export function getShortDescription(description: string, maxLength: number = 50): string {
  const cleaned = cleanTransactionDescription(description);
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength - 3) + '...';
}
