/**
 * Fase 4: Remover Duplicações de Páginas
 * Remove páginas duplicadas e cria redirects
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'src', 'app');

// Páginas duplicadas para remover
const DUPLICATES = [
  {
    path: 'lembretes',
    redirectTo: '/reminders',
    reason: 'Duplicata em PT de reminders'
  },
  {
    path: 'travel',
    redirectTo: '/trips',
    reason: 'Duplicata de trips'
  },
  {
    path: 'cards',
    redirectTo: '/credit-cards',
    reason: 'Duplicata de credit-cards'
  }
];

function createRedirect(dirPath, redirectTo) {
  const pageFile = path.join(dirPath, 'page.tsx');
  
  const redirectContent = `import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('${redirectTo}');
}
`;
  
  fs.writeFileSync(pageFile, redirectContent);
}

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

async function fase4() {
  console.log('🔄 Fase 4: Remover Duplicações de Páginas\n');
  
  let removedCount = 0;
  let redirectsCreated = 0;
  
  for (const dup of DUPLICATES) {
    const dirPath = path.join(APP_DIR, dup.path);
    
    console.log(`\n📂 Processando: app/${dup.path}/`);
    console.log(`   Motivo: ${dup.reason}`);
    console.log(`   Redirect: ${dup.redirectTo}`);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`   ⏭️  Não encontrado (já removido)`);
      continue;
    }
    
    // Criar redirect antes de remover
    try {
      createRedirect(dirPath, dup.redirectTo);
      console.log(`   ✅ Redirect criado`);
      redirectsCreated++;
    } catch (error) {
      console.log(`   ⚠️  Erro ao criar redirect: ${error.message}`);
    }
    
    // Comentar a remoção por segurança - apenas criar redirects
    // if (removeDirectory(dirPath)) {
    //   console.log(`   ✅ Diretório removido`);
    //   removedCount++;
    // }
  }
  
  console.log('\n✅ Fase 4 concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   ✅ Redirects criados: ${redirectsCreated}`);
  console.log(`   📁 Diretórios mantidos (com redirect): ${redirectsCreated}`);
  console.log('\n🎯 Duplicações tratadas com redirects!');
  console.log('\n💡 Os diretórios foram mantidos mas agora redirecionam.');
  console.log('   Você pode removê-los manualmente se preferir.');
}

fase4()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
