const SUPABASE_URL = 'https://ogjyubekshcxcirlboue.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

async function checkCloudStatus() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gn_orders?select=id,customer_name,updated_at,items&customer_name=like.__GN_SYNC_%25&order=updated_at.desc`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const rows = await res.json();
    console.log(`Found ${rows.length} sync rows:`);
    for (const r of rows) {
        const keys = r.items ? Object.keys(r.items) : [];
        const counts = {};
        for (const k of keys) {
            if (Array.isArray(r.items[k])) counts[k] = r.items[k].length;
        }
        console.log(`Row: ${r.customer_name} | ID: ${r.id} | Updated: ${r.updated_at} | Counts:`, counts);
    }
}

checkCloudStatus().catch(console.error);
