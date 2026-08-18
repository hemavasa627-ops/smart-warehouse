const fs = require('fs');
const path = require('path');

const files = [
  'src/App.tsx',
  'src/components/ActiveOrders.tsx',
  'src/components/ControlTower.tsx',
  'src/components/InventoryHealth.tsx',
  'src/components/Layout.tsx',
  'src/context/EngineContext.tsx',
  'src/main.tsx',
  'src/types/index.ts'
];

for(const file of files) {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.endsWith('\\n')) {
    content = content.slice(0, -2) + '\n';
    fs.writeFileSync(fullPath, content);
  }
}
console.log('Fixed files');
