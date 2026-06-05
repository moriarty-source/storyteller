const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', '.env.production.local');
if (fs.existsSync(filePath)) {
  const envFile = fs.readFileSync(filePath, 'utf-8');
  const lines = envFile.replace(/\r/g, '').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      const key = match[1].trim();
      process.env[key] = val;
    }
  }
}

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

async function run() {
  try {
    const rows = await sql("SELECT * FROM stories WHERE code = 'NUSV'");
    console.log(JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
