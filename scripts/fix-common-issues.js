#!/usr/bin/env node

/**
 * Script para corrigir problemas comuns automaticamente
 * - Remover trailing whitespace
 * - Adicionar newline no final do arquivo
 * - Corrigir múltiplas linhas vazias
 * - Corrigir indentação inconsistente
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
    'src/app',
    'src/components',
    'src/lib',
    'src/hooks',
    'src/contexts',
    'src/services',
    'src/utils',
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

let totalFiles = 0;
let filesModified = 0;
const issues = {
    trailingWhitespace: 0,
    missingNewline: 0,
    multipleEmptyLines: 0,
    inconsistentIndentation: 0,
};

function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return EXTENSIONS.includes(ext);
}

function fixCommonIssues(content, filePath) {
    let modified = false;
    let newContent = content;

    // 1. Remover trailing whitespace
    const linesWithTrailing = newContent.split('\n').filter(line => line !== line.trimEnd()).length;
    if (linesWithTrailing > 0) {
        newContent = newContent.split('\n').map(line => line.trimEnd()).join('\n');
        issues.trailingWhitespace += linesWithTrailing;
        modified = true;
    }

    // 2. Adicionar newline no final
    if (!newContent.endsWith('\n')) {
        newContent += '\n';
        issues.missingNewline++;
        modified = true;
    }

    // 3. Corrigir múltiplas linhas vazias (máximo 2)
    const multipleEmpty = /\n\n\n+/g;
    if (multipleEmpty.test(newContent)) {
        newContent = newContent.replace(multipleEmpty, '\n\n');
        issues.multipleEmptyLines++;
        modified = true;
    }

    // 4. Detectar indentação inconsistente (tabs vs spaces)
    const lines = newContent.split('\n');
    const hasSpaces = lines.some(line => line.startsWith('  '));
    const hasTabs = lines.some(line => line.startsWith('\t'));

    if (hasSpaces && hasTabs) {
        // Converter tabs para spaces (2 espaços)
        newContent = newContent.replace(/^\t+/gm, match => '  '.repeat(match.length));
        issues.inconsistentIndentation++;
        modified = true;
    }

    return { content: newContent, modified };
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { content: newContent, modified } = fixCommonIssues(content, filePath);

        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            filesModified++;
            console.log(`✅ ${filePath}`);
        }

        totalFiles++;
    } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
}

function scanDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!item.startsWith('.') && item !== 'node_modules') {
                    scanDirectory(fullPath);
                }
            } else if (stat.isFile() && shouldProcessFile(fullPath)) {
                processFile(fullPath);
            }
        }
    } catch (error) {
        console.error(`❌ Erro ao escanear ${dirPath}:`, error.message);
    }
}

console.log('🔧 Corrigindo problemas comuns...\n');

for (const dir of DIRECTORIES_TO_SCAN) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        console.log(`📁 Escaneando: ${dir}`);
        scanDirectory(fullPath);
    }
}

console.log('\n📊 RESUMO:');
console.log(`   Arquivos processados: ${totalFiles}`);
console.log(`   Arquivos modificados: ${filesModified}`);
console.log('\n📊 PROBLEMAS CORRIGIDOS:');
console.log(`   Trailing whitespace: ${issues.trailingWhitespace} linhas`);
console.log(`   Missing newline: ${issues.missingNewline} arquivos`);
console.log(`   Múltiplas linhas vazias: ${issues.multipleEmptyLines} ocorrências`);
console.log(`   Indentação inconsistente: ${issues.inconsistentIndentation} arquivos`);
console.log('\n✅ Correções concluídas!');
