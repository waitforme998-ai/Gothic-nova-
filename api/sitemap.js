// api/sitemap.js - Dynamic XML Sitemap for Gothic Nova (Zero-Dependency Node.js Native)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ogjyubekshcxcirlboue.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

module.exports = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let products = [];
        let categories = [];

        // Query live products directly from Supabase PostgREST API using native fetch (no npm packages)
        try {
            const prodEndpoint = `${SUPABASE_URL}/rest/v1/gn_orders?customer_name=eq.__GN_SYNC_PRODUCTS__&select=items`;
            const prodRes = await fetch(prodEndpoint, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (prodRes.ok) {
                const rows = await prodRes.json();
                if (Array.isArray(rows) && rows.length > 0 && rows[0].items) {
                    const raw = rows[0].items;
                    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.products) ? raw.products : []);
                    products = list.filter(p => p && p.active !== false && p.id);
                }
            }
        } catch (fetchErr) {
            console.warn('Product fetch notice for sitemap:', fetchErr.message);
        }

        // Query live categories from Supabase
        try {
            const catEndpoint = `${SUPABASE_URL}/rest/v1/gn_orders?customer_name=eq.__GN_SYNC_CATEGORIES__&select=items`;
            const catRes = await fetch(catEndpoint, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (catRes.ok) {
                const rows = await catRes.json();
                if (Array.isArray(rows) && rows.length > 0 && rows[0].items) {
                    const raw = rows[0].items;
                    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.categories) ? raw.categories : []);
                    categories = list.filter(c => c && c.id);
                }
            }
        } catch (catErr) {
            console.warn('Category fetch notice for sitemap:', catErr.message);
        }

        // 1. Core static storefront & category pages
        const staticPages = [
            { loc: 'https://gothicnova.com/', priority: '1.0', changefreq: 'daily', lastmod: today },
            { loc: 'https://gothicnova.com/category.html', priority: '0.8', changefreq: 'weekly', lastmod: today }
        ];

        // Known default category slugs + dynamic ones from database
        const defaultSlugs = ['rings', 'bracelets', 'pendants', 'chokers', 'necklace', 'glasses'];
        const allCatSlugs = new Set(defaultSlugs);
        categories.forEach(c => {
            if (c.id && String(c.id).trim().toLowerCase() !== 'general') {
                allCatSlugs.add(String(c.id).trim().toLowerCase());
            }
        });

        allCatSlugs.forEach(slug => {
            staticPages.push({
                loc: `https://gothicnova.com/category.html?cat=${encodeURIComponent(slug)}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod: today
            });
        });

        const staticXml = staticPages.map(page => `
    <url>
        <loc>${page.loc}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('');

        // 2. Dynamic active product pages
        const productXml = products.map(p => {
            const prodLastMod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today;
            const safeId = encodeURIComponent(String(p.id));
            return `
    <url>
        <loc>https://gothicnova.com/?product=${safeId}</loc>
        <lastmod>${prodLastMod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
        }).join('');

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${productXml}
</urlset>`;

        // Cache response at Vercel Edge for 1 hour to prevent DB spikes during crawler runs
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
        res.status(200).send(xmlContent);
    } catch (err) {
        console.error('Dynamic sitemap generation error:', err);
        // Fallback minimal valid XML rather than failing with HTTP 500
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://gothicnova.com/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://gothicnova.com/category.html</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.status(200).send(fallbackXml);
    }
};
