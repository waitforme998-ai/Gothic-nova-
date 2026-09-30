const url = 'https://ogjyubekshcxcirlboue.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

async function run() {
    console.log('Fetching latest cloud sync state from Supabase...');
    const res = await fetch(url + '/rest/v1/gn_orders?customer_name=eq.__GN_STORE_SYNC__&order=created_at.desc&limit=1', {
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const rows = await res.json();
    if (!rows || rows.length === 0) {
        console.log('No sync rows found.');
        return;
    }
    const latest = rows[0];
    const items = latest.items || {};
    console.log('Current categories:', items.categories);
    console.log('Current products count:', items.products ? items.products.length : 0);

    const categories = Array.isArray(items.categories) && items.categories.length > 0 ? items.categories : [
        { id: 'rings', name: 'Rings' },
        { id: 'chains', name: 'Chains' },
        { id: 'bracelets', name: 'Bracelets' },
        { id: 'pendants', name: 'Pendants' }
    ];

    function normalizeCat(p) {
        let cat = (p.category || '').trim().toLowerCase();
        if (!cat || cat === 'general' || cat === 'all') {
            const name = (p.name || '').toLowerCase();
            if (name.includes('ring') || name.includes('claw') || name.includes('spider')) cat = 'rings';
            else if (name.includes('chain') || name.includes('choker') || name.includes('helix') || name.includes('cross') || name.includes('necklace')) cat = 'chains';
            else if (name.includes('bracelet') || name.includes('spine') || name.includes('bangle') || name.includes('pearl')) cat = 'bracelets';
            else if (name.includes('pendant') || name.includes('reaper') || name.includes('heart') || name.includes('blood') || name.includes('dragon')) cat = 'pendants';
            else cat = 'rings';
        }
        return cat;
    }

    const normalizedProducts = (items.products || []).map(p => ({
        ...p,
        category: normalizeCat(p),
        active: p.active !== false
    }));

    const announcements = Array.isArray(items.announcements) && items.announcements.length > 0 ? items.announcements : [
        'Free delivery across Pakistan',
        'VIP packaging & Cash on Delivery'
    ];

    const reviews = Array.isArray(items.reviews) && items.reviews.length > 0 ? items.reviews : [
        {
            id: 'rev_1',
            author: 'Baqir',
            customer_name: 'Baqir',
            rating: 5,
            comment: 'Best ever quality necklace never thought it would be exactly as it is shown.',
            review_text: 'Best ever quality necklace never thought it would be exactly as it is shown.',
            location: 'Pakistan',
            is_verified: true,
            product_name: 'Spider necklace'
        }
    ];

    const updatedItems = {
        products: normalizedProducts,
        categories: categories,
        announcements: announcements,
        reviews: reviews,
        updated_at: new Date().toISOString(),
        version: 2
    };

    console.log('Normalized products:');
    normalizedProducts.forEach(p => console.log(` - [${p.id}] ${p.name} -> category: ${p.category}`));

    console.log('Pushing updated master sync state to Supabase...');
    const insertRes = await fetch(url + '/rest/v1/gn_orders', {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            customer_name: '__GN_STORE_SYNC__',
            phone_number: '00000000000',
            house_flat_no: 'SYSTEM',
            street_address: 'SYSTEM',
            city: 'SYSTEM',
            province: 'SYSTEM',
            nearest_landmark: 'SYSTEM',
            payment_method: 'cod',
            items: updatedItems,
            total_amount: 0,
            status: 'Cancelled'
        })
    });

    const insertResult = await insertRes.json();
    console.log('Insert response status:', insertRes.status);
    console.log('New Sync Record ID:', insertResult[0] ? insertResult[0].id : 'N/A');
}

run();
