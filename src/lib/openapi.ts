/**
 * Gerador de Especificação OpenAPI
 * Documenta todas as APIs do sistema
 */

export function generateOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'SuaGrana API',
      version: '1.0.0',
      description: 'API de Gestão Financeira Pessoal',
      contact: {
        name: 'SuaGrana Support',
        email: 'support@suagrana.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Desenvolvimento',
      },
      {
        url: 'https://suagrana.com/api',
        description: 'Produção',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Autenticação e autorização' },
      { name: 'Transactions', description: 'Transações financeiras' },
      { name: 'Accounts', description: 'Contas bancárias' },
      { name: 'Credit Cards', description: 'Cartões de crédito' },
      { name: 'Trips', description: 'Viagens' },
      { name: 'Goals', description: 'Metas financeiras' },
      { name: 'Investments', description: 'Investimentos' },
    ],
    paths: {
      '/auth/login': {
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
                    password: { type: 'string', minLength: 6 },
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
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Credenciais inválidas' },
          },
        },
      },
      '/transactions': {
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
              schema: { type: 'integer', default: 50 },
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
            201: {
              description: 'Transação criada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Transaction' },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'Sistema saudável',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
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
            isActive: { type: 'boolean' },
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
            accountId: { type: 'string' },
            categoryId: { type: 'string' },
          },
        },
        TransactionInput: {
          type: 'object',
          required: ['description', 'amount', 'type', 'date'],
          properties: {
            description: { type: 'string' },
            amount: { type: 'number', minimum: 0 },
            type: { type: 'string', enum: ['RECEITA', 'DESPESA', 'TRANSFERENCIA'] },
            date: { type: 'string', format: 'date-time' },
            accountId: { type: 'string' },
            categoryId: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
    },
    security: [{ cookieAuth: [] }],
  };
}
