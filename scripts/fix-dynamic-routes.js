const fs = require('fs');
const path = require('path');

// Diretório das rotas de API
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

// Função para processar arquivos recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'route.ts') {
      processRouteFile(filePath);
    }
  });
}

// Função para processar cada arquivo de rota
function processRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Verificar se já tem a configuração
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`✓ Já configurado: ${filePath}`);
    return;
  }

  // Adicionar a configuração após os imports
  const lines = content.split('\n');
  let insertIndex = -1;

  // Encontrar a última linha de import ou a primeira linha de código
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('export const runtime')) {
      insertIndex = i + 1;
    } else if (insertIndex > -1 && lines[i].trim() === '') {
      // Linha vazia após imports
      break;
    } else if (insertIndex > -1 && !lines[i].trim().startsWith('import') && !lines[i].trim().startsWith('export const runtime')) {
      break;
    }
  }

  if (insertIndex > -1) {
    // Inserir a configuração
    lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic';");
    content = lines.join('\n');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Configurado: ${filePath}`);
  } else {
    console.log(`⚠ Não foi possível configurar: ${filePath}`);
  }
}

// Executar
console.log('Configurando rotas dinâmicas...\n');
processDirectory(apiDir);
console.log('\n✓ Concluído!');
