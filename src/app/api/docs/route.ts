/**
 * API DOCUMENTATION ENDPOINT
 * Serve a documentação Swagger da API
 */

import { NextResponse } from 'next/server';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SuaGrana API',
    version: '2.0.0',
    description: 'API de gestão financeira pessoal',
    contact: {
      name: 'Suporte SuaGrana',
      email: 'suporte@suagrana.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Desenvolvimento',
    },
    {
      url: 'https://suagrana.com',
      description: 'Produção',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticação e autorização' },
    { name: 'Transactions', description: 'Transações financeiras' },
    { name: 'Accounts', description: 'Contas bancárias' },
    { name: 'Categories', description: 'Categorias' },
    { name: 'Credit Cards', description: 'Cartões de crédito' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login de usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login bem-sucedido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Credenciais inválidas' },
          429: { description: 'Muitas tentativas' },
        },
      },
    },
    '/api/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'Listar transações',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 },
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          200: {
            description: 'Lista de transações',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    transactions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          401: { description: 'Não autenticado' },
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Criar transação',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TransactionInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Transação criada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    transaction: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autenticado' },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          type: { type: 'string', enum: ['RECEITA', 'DESPESA', 'TRANSFERENCIA'] },
          date: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'cleared', 'reconciled'] },
          categoryId: { type: 'string' },
          accountId: { type: 'string', nullable: true },
          creditCardId: { type: 'string', nullable: true },
        },
      },
      TransactionInput: {
        type: 'object',
        required: ['description', 'amount', 'type', 'date', 'categoryId'],
        properties: {
          description: { type: 'string', minLength: 1 },
          amount: { type: 'number', minimum: 0.01 },
          type: { type: 'string', enum: ['RECEITA', 'DESPESA', 'TRANSFERENCIA'] },
          date: { type: 'string', format: 'date-time' },
          categoryId: { type: 'string' },
          accountId: { type: 'string', nullable: true },
          creditCardId: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export async function GET() {
  return NextResponse.json(swaggerDocument);
}
