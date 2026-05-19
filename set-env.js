const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const targetPath = path.resolve(__dirname, './src/environments/environment.ts');
const targetProdPath = path.resolve(__dirname, './src/environments/environment.prod.ts');

let apiUrl = 'https://ecosistema-centro.ddev.site/api'; // Default

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const lines = envFile.split('\n');
  lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match != null) {
      const key = match[1];
      let value = match[2] || '';
      value = value.replace(/(^['"]|['"]$)/g, '').trim();
      
      if (key === 'API_URL') {
        apiUrl = value;
      }
    }
  });
}

const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}'
};
`;

const envProdConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const dir = path.resolve(__dirname, './src/environments');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log(`[set-env.js] Updated ${targetPath} with API_URL: ${apiUrl}`);

fs.writeFileSync(targetProdPath, envProdConfigFile);
console.log(`[set-env.js] Updated ${targetProdPath} with API_URL: ${apiUrl}`);
