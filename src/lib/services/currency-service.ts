/**
 * CurrencyService - Serviço de conversão de moedas
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class CurrencyService {
    /**
     * Converte moeda
     * Requirements: 19.1, 19.2, 19.3
     */
    async convertCurrency(
        amount: number,
        fromCurrency: string,
        toCurrency: string,
        exchangeRate?: number
    ): Promise<{ originalAmount: number; convertedAmount: number; exchangeRate: number }> {
        // Se não forneceu taxa, buscar ou usar padrão
        const rate = exchangeRate || (await this.getExchangeRate(fromCurrency, toCurrency));

        const convertedAmount = amount * rate;

        return {
            originalAmount: amount,
            convertedAmount,
            exchangeRate: rate,
        };
    }

    /**
     * Busca taxa de câmbio (mock - integrar com API real)
     */
    private async getExchangeRate(from: string, to: string): Promise<number> {
        // TODO: Integrar com API de câmbio (ex: exchangerate-api.com)
        // Por enquanto, retornar taxas fixas
        const rates: any = {
            'USD-BRL': 5.0,
            'EUR-BRL': 5.5,
            'BRL-USD': 0.2,
            'BRL-EUR': 0.18,
        };

        return rates[`${from}-${to}`] || 1;
    }

    /**
     * Cria transação em moeda estrangeira
     * Requirements: 19.4, 19.5
     */
    async createForeignTransaction(data: {
        userId: string;
        accountId: string;
        amount: number;
        currency: string;
        description: string;
        date: Date;
        exchangeRate?: number;
    }): Promise<any> {
        // Buscar moeda padrão do usuário
        const settings = await prisma.userSettings.findUnique({
            where: { userId: data.userId },
        });

        const defaultCurrency = settings?.defaultCurrency || 'BRL';

        // Converter para moeda padrão
        const conversion = await this.convertCurrency(
            data.amount,
            data.currency,
            defaultCurrency,
            data.exchangeRate
        );

        // Criar transação
        const transaction = await prisma.transaction.create({
            data: {
                userId: data.userId,
                accountId: data.accountId,
                amount: new Decimal(conversion.convertedAmount),
                description: data.description,
                type: 'expense',
                date: data.date,
                currency: data.currency,
                exchangeRate: new Decimal(conversion.exchangeRate),
                originalAmount: new Decimal(data.amount),
            },
        });

        return transaction;
    }
}

export const currencyService = new CurrencyService();
