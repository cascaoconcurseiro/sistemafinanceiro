#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n🔐 Gerando chaves secretas para produção...\n');
console.log('═'.repeat(60));

const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
const cronSecret = crypto.randomBytes(32).toString('hex');

console.log('\n📋 Copie estas variáveis para o Netlify:\n');
console.log('─'.repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`CRON_SECRET=${cronSecret}`);
console.log('─'.repeat(60));

console.log('\n✅ Chaves geradas com sucesso!');
console.log('\n📝 Próximos passos:');
console.log('   1. Acesse o Netlify Dashboard');
console.log('   2. Vá em Site settings → Environment variables');
console.log('   3. Adicione cada variável acima');
console.log('   4. Configure também a DATABASE_URL');
console.log('   5. Faça um novo deploy\n');
console.log('═'.repeat(60));
console.log('\n');
