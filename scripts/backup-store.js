const fs = require('fs');
const path = require('path');

const engineContent = fs.readFileSync(path.join(__dirname, '..', 'supabase-engine.js'), 'utf8');
const url = engineContent.match(/DEFAULT_SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = engineContent.match(/DEFAULT_SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function runBackup() {
  console.log('Fetching live store sections from Supabase...');
  
  const sections = [
    { key: 'products', syncName: '__GN_SYNC_PRODUCTS__' },
    { key: 'categories', syncName: '__GN_SYNC_CATEGORIES__' },
    { key: 'reviews', syncName: '__GN_SYNC_REVIEWS__' },
    { key: 'announcements', syncName: '__GN_SYNC_ANNOUNCEMENTS__' }
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    epoch: Date.now(),
    supabaseUrl: url,
    data: {}
  };

  for (const sec of sections) {
    try {
      const res = await fetch(`${url}/rest/v1/gn_orders?customer_name=eq.${sec.syncName}&select=*`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        backupData.data[sec.key] = rows[0].items || [];
        console.log(`✓ Backed up ${sec.key}: ${Array.isArray(backupData.data[sec.key]) ? backupData.data[sec.key].length : 'object'} entries`);
      } else {
        backupData.data[sec.key] = [];
        console.warn(`! No rows found for ${sec.key}`);
      }
    } catch(err) {
      console.error(`Error backing up ${sec.key}:`, err.message);
    }
  }

  const backupDir = path.join(__dirname, '..', 'docs', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, 'latest_clean_store_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  const sizeKb = (fs.statSync(backupPath).size / 1024).toFixed(1);
  console.log(`\n🎉 Backup successfully created: ${backupPath} (${sizeKb} KB)`);
}

runBackup().catch(console.error);
