const { execSync } = require('child_process');
const dbUrl = process.env.DATABASE_URL || '';
const directUrl = dbUrl.replace('-pooler', '');
console.log('Running migrate deploy with direct URL (pooler stripped)...');
execSync('node node_modules/prisma/build/index.js migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: directUrl }
});
