/**
 * Fase 3: Consolidação de Serviços
 * Move serviços de src/services/ para src/lib/services/
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'src', 'services');
const TARGET_DIR = path.join(__dirname, '..', 'src', 'lib', 'services');

async function fase3() {
  console.log('🔄 Fase 3: Consolidação de Serviços\n');
  
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log('✅ Pasta src/services/ não existe. Já foi consolidada!');
    return;
  }
  
  const files = fs.readdirSync(SOURCE_DIR);
  
  if (files.length === 0) {
    console.log('✅ Pasta src/services/ está vazia. Removendo...');
    fs.rmdirSync(SOURCE_DIR);
    return;
  }
  
  console.log(`📊 Encontrados ${files.length} arquivos para mover\n`);
  
  let movedCount = 0;
  
  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(TARGET_DIR, file);
    
    // Verificar se já existe no destino
    if (fs.existsSync(targetPath)) {
      console.log(`⚠️  Já existe: ${file} (mantendo versão em lib/services/)`);
      // Deletar o da pasta services/
      fs.unlinkSync(sourcePath);
      continue;
    }
    
    // Mover arquivo
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ Movido: ${file} → lib/services/`);
    movedCount++;
  }
  
  // Remover pasta vazia
  if (fs.readdirSync(SOURCE_DIR).length === 0) {
    fs.rmdirSync(SOURCE_DIR);
    console.log('\n📁 Pasta src/services/ removida (vazia)');
  }
  
  console.log('\n✅ Fase 3 concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   ✅ Arquivos movidos: ${movedCount}`);
  console.log(`   ⚠️  Arquivos já existentes: ${files.length - movedCount}`);
  console.log('\n🎯 Serviços consolidados em lib/services/!');
}

fase3()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
