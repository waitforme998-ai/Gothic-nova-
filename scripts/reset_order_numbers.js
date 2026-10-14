const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';
const baseUrl = 'https://ogjyubekshcxcirlboue.supabase.co/rest/v1/gn_orders';

async function main() {
  console.log('Fetching all rows from gn_orders...');
  const res = await fetch(baseUrl + '?select=id,order_number,customer_name', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const rows = await res.json();
  console.log('Total rows found:', rows.length);

  let negCount = -100;
  for (const r of rows) {
    if (r.customer_name === '__TEST_DELETED__' || r.customer_name.startsWith('__GN_')) {
      const targetNum = negCount--;
      const updateRes = await fetch(baseUrl + '?id=eq.' + r.id, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_number: targetNum })
      });
      if (updateRes.status !== 200 && updateRes.status !== 204) {
        console.error('Failed to update row', r.id, updateRes.status);
      }
    }
  }

  console.log('All legacy and system rows shifted to negative space.');

  // Verify
  const verifyRes = await fetch(baseUrl + '?select=id,order_number,customer_name&order_number=gt.0', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const positiveRows = await verifyRes.json();
  console.log('Active positive orders remaining (should be 0):', positiveRows.length);
  if (positiveRows.length > 0) {
    console.log(positiveRows);
  }
}

main().catch(console.error);
