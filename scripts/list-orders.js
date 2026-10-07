const SUPABASE_URL = 'https://ogjyubekshcxcirlboue.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

async function listRealOrders() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gn_orders?select=id,order_number,customer_name,status,total_amount,created_at&customer_name=not.like.__GN_%25&order=created_at.desc`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const orders = await res.json();
    console.log(`Found ${orders.length} real cloud orders:`);
    orders.forEach(o => console.log(` - ID: ${o.id} | #${o.order_number} | Customer: ${o.customer_name} | Status: ${o.status} | Total: ${o.total_amount} | Date: ${o.created_at}`));
}

listRealOrders().then(() => setTimeout(() => process.exit(0), 100)).catch(console.error);
