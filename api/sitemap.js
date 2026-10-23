// api/sitemap.js - Dynamic XML Sitemap for Gothic Nova (Zero-Dependency Node.js Native)
// Compliant with Sitemaps XML 0.9 & Google Image Sitemap 1.1 Specifications

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtphuycoriazzkoalyyh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGh1eWNvcmlhenprb2FseXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODExNTYsImV4cCI6MjEwODI1NzE1Nn0.PiQ6a1Kd4lSt6O-15OqUdebKTydt6R6dhYgzOdOkyLM';
const CANONICAL_DOMAIN = 'https://gothicnova.com';
const BRAND_FALLBACK_IMAGE = 'https://gothicnova.com/assets/gothic_nova_brand_og.png';

/**
 * Escapes characters for XML compliance to prevent syntax errors
 */
function escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Normalizes image paths to fully qualified, crawler-valid HTTPS URLs.
 * Base64 data URLs cannot be indexed by search engine sitemaps and are mapped to brand fallback.
 */
function resolveImageUrl(img) {
    if (!img || typeof img !== 'string') return BRAND_FALLBACK_IMAGE;
    const trimmed = img.trim();
    if (!trimmed || trimmed.startsWith('data:')) return BRAND_FALLBACK_IMAGE;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return 'https:' + trimmed;
    if (trimmed.startsWith('/')) return `${CANONICAL_DOMAIN}${trimmed}`;
    return `${CANONICAL_DOMAIN}/${trimmed}`;
}

module.exports = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let products = [];
        let categories = [];

        // 1. Query live products directly from Supabase PostgREST API using native fetch
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

        // 2. Query live categories from Supabase PostgREST API
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

        // 3. Dynamic Category aggregation (Database + Product-assigned categories + Defaults)
        const defaultSlugs = ['rings', 'bracelets', 'pendants', 'chokers', 'necklace', 'chains', 'glasses'];
        const allCatSlugs = new Set(defaultSlugs);

        // Add from categories table
        categories.forEach(c => {
            if (c.id && String(c.id).trim().toLowerCase() !== 'general') {
                allCatSlugs.add(String(c.id).trim().toLowerCase());
            }
        });

        // Add dynamically from active products
        products.forEach(p => {
            if (p.category && String(p.category).trim() && String(p.category).trim().toLowerCase() !== 'general') {
                allCatSlugs.add(String(p.category).trim().toLowerCase());
            }
        });

        // Optional diagnostic JSON endpoint for developer inspection (?format=json or ?debug=1)
        if (req && req.query && (req.query.format === 'json' || req.query.debug === '1')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.status(200).json({
                status: 'success',
                canonicalDomain: CANONICAL_DOMAIN,
                lastmod: today,
                totalProducts: products.length,
                totalCategories: allCatSlugs.size,
                categories: Array.from(allCatSlugs),
                products: products.map(p => {
                    const price = Number(p.price || 0);
                    const saleVal = (p.salePrice !== undefined && p.salePrice !== null && p.salePrice !== '') 
                        ? Number(p.salePrice) 
                        : (p.sale_price !== undefined ? Number(p.sale_price) : null);
                    const isSale = saleVal !== null && saleVal > 0 && saleVal < price;
                    const activePrice = isSale ? saleVal : price;
                    return {
                        id: p.id,
                        name: p.name,
                        category: p.category || 'general',
                        price: price,
                        salePrice: saleVal,
                        activePrice: activePrice,
                        stock: (p.stock !== undefined && p.stock !== null && p.stock !== '') ? Number(p.stock) : 999,
                        url: `${CANONICAL_DOMAIN}/?product=${encodeURIComponent(String(p.id))}`
                    };
                })
            });
        }

        // 4. Core static storefront URLs
        const staticPages = [
            {
                loc: `${CANONICAL_DOMAIN}/`,
                priority: '1.0',
                changefreq: 'daily',
                lastmod: today,
                image: {
                    loc: `${CANONICAL_DOMAIN}/assets/hero_gothic_bg.png`,
                    title: 'Gothic Nova — Cyber-Goth & Alternative Jewelry Pakistan',
                    caption: 'Shop premium artisanal rings, chains, chokers, and pendants with Cash on Delivery nationwide across Pakistan.'
                }
            },
            {
                loc: `${CANONICAL_DOMAIN}/category.html`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod: today,
                image: {
                    loc: BRAND_FALLBACK_IMAGE,
                    title: 'Gothic Nova Jewelry Collections',
                    caption: 'Complete catalog of dark aesthetic, grunge, and Japanese cyberpunk jewelry in Pakistan.'
                }
            }
        ];

        // 5. Category filtered routes (both index.html?cat= and category.html?cat=)
        allCatSlugs.forEach(slug => {
            const formattedCatName = slug.charAt(0).toUpperCase() + slug.slice(1);
            staticPages.push({
                loc: `${CANONICAL_DOMAIN}/category.html?cat=${encodeURIComponent(slug)}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod: today,
                image: {
                    loc: BRAND_FALLBACK_IMAGE,
                    title: `Gothic Nova ${formattedCatName} Collection`,
                    caption: `Explore handcrafted gothic ${slug} with Cash on Delivery across Pakistan.`
                }
            });
            staticPages.push({
                loc: `${CANONICAL_DOMAIN}/?cat=${encodeURIComponent(slug)}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod: today,
                image: {
                    loc: BRAND_FALLBACK_IMAGE,
                    title: `Gothic Nova ${formattedCatName} Catalog`,
                    caption: `Shop curated ${slug} online in Pakistan. Free shipping on qualifying orders.`
                }
            });
        });

        const staticXml = staticPages.map(page => `
    <url>
        <loc>${escapeXml(page.loc)}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
        ${page.image ? `
        <image:image>
            <image:loc>${escapeXml(page.image.loc)}</image:loc>
            <image:title>${escapeXml(page.image.title)}</image:title>
            <image:caption>${escapeXml(page.image.caption)}</image:caption>
        </image:image>` : ''}
    </url>`).join('');

        // 6. Dynamic active product pages with complete names, prices, categories & image metadata
        const productXml = products.map((p, index) => {
            const prodLastMod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today;
            const safeId = encodeURIComponent(String(p.id));
            const prodUrl = `${CANONICAL_DOMAIN}/?product=${safeId}`;

            // Price resolution
            const regularPrice = Number(p.price || 0);
            const saleVal = (p.salePrice !== undefined && p.salePrice !== null && p.salePrice !== '') 
                ? Number(p.salePrice) 
                : (p.sale_price !== undefined ? Number(p.sale_price) : null);
            const isSale = saleVal !== null && saleVal > 0 && saleVal < regularPrice;
            const activePrice = isSale ? saleVal : regularPrice;

            // Stock & availability
            const rawStock = (p.stock !== undefined && p.stock !== null && p.stock !== '') ? Number(p.stock) : 999;
            const isSoldOut = rawStock <= 0;
            const stockStatus = isSoldOut ? 'Sold Out' : 'In Stock';

            // Rich caption & title for Google Images and Search
            const priceFormatted = activePrice > 0 ? `Rs. ${activePrice.toLocaleString('en-PK')}` : 'Contact for Price';
            const priceDetails = isSale 
                ? `${priceFormatted} (Regular: Rs. ${regularPrice.toLocaleString('en-PK')}, Save Rs. ${(regularPrice - activePrice).toLocaleString('en-PK')})`
                : priceFormatted;
            
            const rawDesc = (p.desc || p.description || '').replace(/\s+/g, ' ').trim();
            const descSnippet = rawDesc.length > 140 ? rawDesc.slice(0, 137) + '...' : rawDesc;
            const catName = p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : 'Gothic Jewelry';

            const imageTitle = `${p.name} | ${priceFormatted}`;
            const imageCaption = `${p.name} - Price: ${priceDetails} | Availability: ${stockStatus} | Category: ${catName}. ${descSnippet ? descSnippet + ' ' : ''}Handcrafted alternative jewelry by Gothic Nova with Cash on Delivery nationwide in Pakistan.`;

            // Primary image
            const primaryImgUrl = resolveImageUrl(p.img);
            let imageTags = `
        <image:image>
            <image:loc>${escapeXml(primaryImgUrl)}</image:loc>
            <image:title>${escapeXml(imageTitle)}</image:title>
            <image:caption>${escapeXml(imageCaption)}</image:caption>
        </image:image>`;

            // Secondary gallery images (if available)
            const secondaryImgs = Array.isArray(p.stock_images) && p.stock_images.length > 0 
                ? p.stock_images 
                : (Array.isArray(p.stockImages) ? p.stockImages : []);

            secondaryImgs.forEach((secImg, secIdx) => {
                const resolvedSec = resolveImageUrl(secImg);
                if (resolvedSec && resolvedSec !== BRAND_FALLBACK_IMAGE && resolvedSec !== primaryImgUrl) {
                    imageTags += `
        <image:image>
            <image:loc>${escapeXml(resolvedSec)}</image:loc>
            <image:title>${escapeXml(`${p.name} (View ${secIdx + 2}) | ${priceFormatted}`)}</image:title>
            <image:caption>${escapeXml(`${p.name} additional gallery view. Price: ${priceDetails}. Available at Gothic Nova.`)}</image:caption>
        </image:image>`;
                }
            });

            return `
    <!-- Product #${index + 1}: ${escapeXml(p.name)} | Category: ${escapeXml(p.category || 'general')} | Price: PKR ${activePrice} | Status: ${stockStatus} | ID: ${escapeXml(p.id)} -->
    <url>
        <loc>${escapeXml(prodUrl)}</loc>
        <lastmod>${prodLastMod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>${imageTags}
    </url>`;
        }).join('');

        // 7. Assemble complete compliant XML document with sitemap & image namespaces
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticXml}
${productXml}
</urlset>`;

        // Cache response at Vercel Edge for 1 hour with 24h background revalidation
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(xmlContent);
    } catch (err) {
        console.error('Dynamic sitemap generation error:', err);
        // Fallback minimal valid XML rather than failing with HTTP 500
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
