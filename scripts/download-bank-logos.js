const https = require('https');
const fs = require('fs');
const path = require('path');

// Lista de bancos para baixar
const banks = [
  '001-banco-do-brasil',
  '033-santander',
  '104-caixa',
  '237-bradesco',
  '341-itau',
  '260-nubank',
  '077-inter',
  '290-pagseguro',
  '323-mercado-pago',
  '212-original',
  '336-c6',
  '422-safra',
  '756-sicoob',
  '748-sicredi',
  '655-neon',
  '380-picpay',
  '403-cora',
  '197-stone',
  '389-mercantil',
  '623-pan',
];

const baseUrl = 'https://raw.githubusercontent.com/Tgentil/Bancos-em-SVG/main/bancos/';
const outputDir = path.join(__dirname, '..', 'public', 'banks');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🏦 Baixando logos dos bancos...\n');

let downloaded = 0;
let failed = 0;

banks.forEach((bank) => {
  const url = `${baseUrl}${bank}.svg`;
  const filePath = path.join(outputDir, `${bank}.svg`);

  https.get(url, (response) => {
    if (response.statusCode === 200) {
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        downloaded++;
        console.log(`✅ ${bank}.svg`);

        if (downloaded + failed === banks.length) {
          console.log(`\n🎉 Download concluído!`);
          console.log(`   ✅ ${downloaded} logos baixadas`);
          if (failed > 0) {
            console.log(`   ❌ ${failed} falharam`);
          }
        }
      });
    } else {
      failed++;
      console.log(`❌ ${bank}.svg (Status: ${response.statusCode})`);

      if (downloaded + failed === banks.length) {
        console.log(`\n🎉 Download concluído!`);
        console.log(`   ✅ ${downloaded} logos baixadas`);
        if (failed > 0) {
          console.log(`   ❌ ${failed} falharam`);
        }
      }
    }
  }).on('error', (err) => {
    failed++;
    console.log(`❌ ${bank}.svg (Erro: ${err.message})`);

    if (downloaded + failed === banks.length) {
      console.log(`\n🎉 Download concluído!`);
      console.log(`   ✅ ${downloaded} logos baixadas`);
      if (failed > 0) {
        console.log(`   ❌ ${failed} falharam`);
      }
    }
  });
});
