import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatPercent,
  generateId,
  cn,
} from '../utils'

describe('formatCurrency', () => {
  it('deve formatar valores positivos em BRL', () => {
    expect(formatCurrency(1500.5)).toBe('R$ 1.500,50')
  })

  it('deve formatar valores negativos', () => {
    expect(formatCurrency(-500)).toBe('-R$ 500,00')
  })

  it('deve formatar zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })

  it('deve formatar valores grandes', () => {
    expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00')
  })
})

describe('formatDate', () => {
  it('deve formatar data string ISO', () => {
    const result = formatDate('2025-11-22T10:00:00.000Z')
    expect(result).toMatch(/\d{2}\/\d{2}\/2025/)
  })

  it('deve formatar objeto Date', () => {
    const date = new Date('2025-11-22')
    const result = formatDate(date)
    expect(result).toMatch(/\d{2}\/\d{2}\/2025/)
  })

  it('deve retornar "Data inválida" para entrada inválida', () => {
    expect(formatDate('invalid')).toBe('Data inválida')
  })
})

describe('formatPercentage', () => {
  it('deve formatar porcentagem com 1 decimal', () => {
    expect(formatPercentage(50)).toBe('50,0%')
  })

  it('deve formatar porcentagem negativa', () => {
    expect(formatPercentage(-25)).toBe('-25,0%')
  })
})

describe('formatPercent', () => {
  it('deve formatar porcentagem com 2 decimais', () => {
    expect(formatPercent(50.55)).toBe('50,55%')
  })
})

describe('generateId', () => {
  it('deve gerar ID único', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('deve gerar ID com tamanho correto', () => {
    const id = generateId()
    expect(id.length).toBe(9)
  })
})

describe('cn', () => {
  it('deve combinar classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('deve remover classes duplicadas', () => {
    expect(cn('class1', 'class1')).toBe('class1')
  })

  it('deve lidar com condicionais', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
  })
})
