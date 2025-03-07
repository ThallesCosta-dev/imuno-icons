const fs = require('fs');
const path = require('path');

// Diretórios de ícones
const directories = {
  immunology: path.join(__dirname, '../public/files'),
  anatomy: path.join(__dirname, '../public/files/anatomy'),
  virus: path.join(__dirname, '../public/files/virus')
};

// Função para filtrar arquivos SVG (evitando variações de cores)
function filterMainSvgFiles(files, directory) {
  return files
    .filter(file => file.endsWith('.svg'))
    .filter(file => {
      // Evitar variações de cores como -grey, -blue, etc.
      const baseName = path.basename(file, '.svg');
      const colorVariants = ['-grey', '-gray', '-blue', '-red', '-green', 
                            '-yellow', '-pink', '-purple', '-brown', 
                            '-orange', '-beige', '-bw'];
      
      return !colorVariants.some(variant => baseName.toLowerCase().endsWith(variant.toLowerCase()));
    })
    .map(file => ({
      id: path.basename(file, '.svg'),
      url: `/files${directory === directories.immunology ? '' : '/' + path.basename(directory)}/${file}`
    }));
}

// Gerar dados para cada categoria
async function generateIconData() {
  const result = {};
  
  for (const [category, directory] of Object.entries(directories)) {
    const files = fs.readdirSync(directory);
    result[category] = filterMainSvgFiles(files, directory);
  }
  
  // Gerar arquivo de saída
  const outputPath = path.join(__dirname, '../src/data/iconData.ts');
  const content = `
// Arquivo gerado automaticamente - não edite manualmente
// Gerado em: ${new Date().toISOString()}

export interface IconItem {
  id: string;
  url: string;
}

export interface IconCategories {
  [category: string]: IconItem[];
}

const iconData: IconCategories = ${JSON.stringify(result, null, 2)};

export default iconData;
`;

  fs.writeFileSync(outputPath, content);
  console.log(`Arquivo de dados de ícones gerado em: ${outputPath}`);
}

generateIconData().catch(console.error); 