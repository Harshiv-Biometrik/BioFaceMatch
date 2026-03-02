const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/react-native-worklets-core/src/plugin/index.js',
  'node_modules/react-native-worklets-core/lib/commonjs/plugin/index.js',
  'node_modules/react-native-worklets-core/lib/module/plugin/index.js',
];

const replacements = [
  [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-transform-nullish-coalescing-operator',
  ],
  ['"@babel/plugin-transform-shorthand-properties", ', ''],
  ['"@babel/plugin-transform-arrow-functions", ', ''],
  [
    ', ["@babel/plugin-transform-template-literals", {\n      loose: true\n    }]',
    '',
  ],
];

for (const relativeFile of files) {
  const file = path.join(process.cwd(), relativeFile);
  if (!fs.existsSync(file)) continue;

  const source = fs.readFileSync(file, 'utf8');
  let updated = source;
  for (const [from, to] of replacements) {
    updated = updated.replaceAll(from, to);
  }

  if (updated === source) continue;
  fs.writeFileSync(file, updated, 'utf8');
  console.log(`patched ${relativeFile}`);
}
