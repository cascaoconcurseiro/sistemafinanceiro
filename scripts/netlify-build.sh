#!/bin/bash

echo "🔧 Iniciando build do Netlify..."

# Copiar configuração do Netlify
cp next.config.netlify.js next.config.js

# Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npx prisma generate

# Executar migrations apenas se DATABASE_URL estiver configurada
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  DATABASE_URL encontrada, executando migrations..."
  npx prisma migrate deploy || echo "⚠️  Migrations falharam, mas continuando build..."
else
  echo "⚠️  DATABASE_URL não configurada, pulando migrations"
fi

# Build do Next.js
echo "🏗️  Building Next.js..."
npm run build

echo "✅ Build concluído!"
