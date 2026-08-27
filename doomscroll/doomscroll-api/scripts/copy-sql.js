// tsc only compiles .ts files, so init.sql is not copied into dist/ automatically.
// src/db/index.ts reads it via __dirname, which is dist/db once built, so the file
// has to sit next to the compiled output for `npm start` to work.
const fs = require('fs');
const path = require('path');

const from = path.join(__dirname, '..', 'src', 'db', 'init.sql');
const to = path.join(__dirname, '..', 'dist', 'db', 'init.sql');

fs.mkdirSync(path.dirname(to), { recursive: true });
fs.copyFileSync(from, to);

console.log('Copied init.sql -> dist/db/init.sql');
