// supabase-engine.js
// GOTHIC NOVA - Enterprise Dual-Mode & Live Supabase Data Adapter
// Seamlessly bridges Supabase PostgreSQL Cloud & LocalStorage fallback
// Per-Section Independent Synchronization Engine

(function() {
    'use strict';

    const DEFAULT_SUPABASE_URL = 'https://ogjyubekshcxcirlboue.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

    const SUPABASE_URL = (typeof localStorage !== 'undefined' && localStorage.getItem('gn_supabase_url')) || DEFAULT_SUPABASE_URL; 
    const SUPABASE_ANON_KEY = (typeof localStorage !== 'undefined' && localStorage.getItem('gn_supabase_anon_key')) || DEFAULT_SUPABASE_ANON_KEY; 
    
    let supabase = null;

    if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof window !== 'undefined' && window.supabase) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            console.log("⚡ Gothic Nova Supabase Engine: LIVE Cloud Mode initialized.");
        } catch (e) {
            console.warn("Supabase init error, falling back to local mode:", e);
        }
    } else {
        console.log("⚡ Gothic Nova Supabase Engine: MOCKUP Mode (localStorage).");
    }

    // Default Seed Catalog (Only used for very first cold start when no database state exists)
    const defaultCatalog = [
        { id: "1", name: "Venom Spider Ring", category: "rings", img: "assets/venom_spider_ring.png", price: 3499, sale_price: null, salePrice: null, stock: 15, threshold: 3, description: "Intricate spider silhouette ring cast in 316L solid surgical steel.", active: true, display_order: 1 },
        { id: "2", name: "Crimson Cross", category: "chains", img: "assets/crimson_cross_choker.png", price: 5999, sale_price: 4499, salePrice: 4499, stock: 8, threshold: 3, description: "Heavyweight gothic cross choker with crimson blood-drop stone inlay.", active: true, display_order: 2 },
        { id: "3", name: "Obsidian Helix", category: "chains", img: "assets/obsidian_helix_chain.png", price: 5999, sale_price: null, salePrice: null, stock: 12, threshold: 3, description: "Interlocking matte obsidian link chain with industrial quick-release clasp.", active: true, display_order: 3 },
        { id: "4", name: "Shadow Claw", category: "rings", img: "assets/shadow_claw_ring.png", price: 3899, sale_price: null, salePrice: null, stock: 10, threshold: 3, description: "Full-finger articulated talon ring engineered for effortless movement.", active: true, display_order: 4 },
        { id: "5", name: "Spine Bracelet", category: "bracelets", img: "assets/spine_bracelet.png", price: 6899, sale_price: null, salePrice: null, stock: 5, threshold: 3, description: "Vertebrae link bracelet with gothic cyber-matte finish.", active: true, display_order: 5 },
        { id: "6", name: "Reaper Pendant", category: "pendants", img: "assets/reaper_pendant.png", price: 8999, sale_price: 7499, salePrice: 7499, stock: 15, threshold: 3, description: "Solid onyx and stainless steel reaper emblem with 60cm rope chain.", active: true, display_order: 6 }
    ];

    // Default Seed Categories
    const defaultCategories = [
        { id: "chains", name: "Chains", display_order: 1 },
        { id: "rings", name: "Rings", display_order: 2 },
        { id: "bracelets", name: "Bracelets", display_order: 3 },
        { id: "pendants", name: "Pendants", display_order: 4 }
    ];

    // Default Seed Reviews
    const defaultReviews = [
        { id: "r1", customer_name: "Sarah M.", author: "Sarah M.", location: "Pakistan", rating: 5, review_text: "The Venom Spider Ring exceeded all expectations. Incredibly detailed craftsmanship.", comment: "The Venom Spider Ring exceeded all expectations. Incredibly detailed craftsmanship.", product_name: "Venom Spider Ring", is_sample: true },
        { id: "r2", customer_name: "Arjun K.", author: "Arjun K.", location: "Pakistan", rating: 5, review_text: "Reaper Pendant is a showstopper. Everyone asks where I got it.", comment: "Reaper Pendant is a showstopper. Everyone asks where I got it.", product_name: "Reaper Pendant", is_sample: true },
        { id: "r3", customer_name: "Emily R.", author: "Emily R.", location: "Pakistan", rating: 5, review_text: "Obsidian Helix is the most beautiful chain I own. Dark and elegant.", comment: "Obsidian Helix is the most beautiful chain I own. Dark and elegant.", product_name: "Obsidian Helix", is_sample: true },
        { id: "r4", customer_name: "Zain A.", author: "Zain A.", location: "Pakistan", rating: 5, review_text: "Fast shipping, premium packaging. This brand is the real deal.", comment: "Fast shipping, premium packaging. This brand is the real deal.", product_name: "General Store", is_sample: true },
        { id: "r5", customer_name: "Priya S.", author: "Priya S.", location: "Pakistan", rating: 4, review_text: "Crimson Cross choker — I get compliments every single time.", comment: "Crimson Cross choker — I get compliments every single time.", product_name: "Crimson Cross", is_sample: true },
        { id: "r6", customer_name: "Liam T.", author: "Liam T.", location: "Pakistan", rating: 5, review_text: "Spine Bracelet fits perfectly. Heavy, solid, worth every rupee.", comment: "Spine Bracelet fits perfectly. Heavy, solid, worth every rupee.", product_name: "Spine Bracelet", is_sample: true },
        { id: "r7", customer_name: "Noor F.", author: "Noor F.", location: "Pakistan", rating: 5, review_text: "Ordered two pieces. Both arrived flawless. Gothic Nova is unmatched.", comment: "Ordered two pieces. Both arrived flawless. Gothic Nova is unmatched.", product_name: "General Store", is_sample: true },
        { id: "r8", customer_name: "James W.", author: "James W.", location: "Pakistan", rating: 5, review_text: "The gothic aesthetic is exactly what I was looking for. Masterpiece.", comment: "The gothic aesthetic is exactly what I was looking for. Masterpiece.", product_name: "General Store", is_sample: true }
    ];

    // Default Seed Hero Slides
    const defaultHeroSlides = [
        { 
            id: "s1", 
            headline: "GOTHIC NOVA // IMMORTAL DROP", 
            title: "GOTHIC NOVA // IMMORTAL DROP", 
            subtext: "Gothic × Japanese Jewelry. Limited. Eternal. Wear the darkness you feel.", 
            subtitle: "Gothic × Japanese Jewelry. Limited. Eternal. Wear the darkness you feel.", 
            button_label: "Explore Drop", 
            cta_text: "Explore Drop", 
            button_link: "#active-drop", 
            cta_link: "#active-drop", 
            img: "assets/hero_gothic_bg.png", 
            image_url: "assets/hero_gothic_bg.png", 
            display_order: 1, 
            active: true, 
            is_active: true 
        },
        { 
            id: "s2", 
            headline: "REAPER COLLECTION", 
            title: "REAPER COLLECTION", 
            subtext: "Handcrafted 316L Stainless Steel & Onyx PVD. Midnight Drop.", 
            subtitle: "Handcrafted 316L Stainless Steel & Onyx PVD. Midnight Drop.", 
            button_label: "Shop Pendants", 
            cta_text: "Shop Pendants", 
            button_link: "index.html?cat=pendants", 
            cta_link: "index.html?cat=pendants", 
            img: "assets/gothic_cathedral_bg.jpg", 
            image_url: "assets/gothic_cathedral_bg.jpg", 
            display_order: 2, 
            active: true, 
            is_active: true 
        },
        { 
            id: "s3", 
            headline: "CRIMSON & HELIX", 
            title: "CRIMSON & HELIX", 
            subtext: "Intricate cyber-goth chains & artifacts engineered for immortality.", 
            subtitle: "Intricate cyber-goth chains & artifacts engineered for immortality.", 
            button_label: "Explore Chains", 
            cta_text: "Explore Chains", 
            button_link: "index.html?cat=chains", 
            cta_link: "index.html?cat=chains", 
            img: "assets/hero_original_bg.webp", 
            image_url: "assets/hero_original_bg.webp", 
            display_order: 3, 
            active: true, 
            is_active: true 
        }
    ];

    // =========================================================================
    // PER-SECTION INDEPENDENT SYNC ENGINE
    // Each section (products, categories, reviews, announcements, hero_slides)
    // has its own cloud row, its own cache, and its own save queue.
    // Saving one section NEVER reads or writes another section's data.
    // =========================================================================
    const SECTION_CONFIG = {
        products:       { syncName: '__GN_SYNC_PRODUCTS__',       localKey: 'gn_products',        defaultData: defaultCatalog },
        categories:     { syncName: '__GN_SYNC_CATEGORIES__',     localKey: 'gn_categories_meta', defaultData: defaultCategories },
        reviews:        { syncName: '__GN_SYNC_REVIEWS__',        localKey: 'gn_reviews',         defaultData: [] },
        announcements:  { syncName: '__GN_SYNC_ANNOUNCEMENTS__',  localKey: 'gn_announcements',   defaultData: [] },
        hero_slides:    { syncName: '__GN_SYNC_HERO_SLIDES__',    localKey: 'gn_hero_slides',     defaultData: defaultHeroSlides }
    };

    // Per-section in-memory caches and save queues
    const _sectionCache = {};
    const _sectionSaveQueue = {};
    for (const key of Object.keys(SECTION_CONFIG)) {
        _sectionCache[key] = null;
        _sectionSaveQueue[key] = Promise.resolve();
    }
    let _migrationDone = false;

    function getStoreSyncBroadcastChannel() {
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                return new BroadcastChannel('gn_store_sync');
            } catch (e) {}
        }
        return null;
    }

    function dispatchUniversalSyncEvents(updatedState) {
        if (typeof window === 'undefined') return;
        try {
            if (updatedState.products !== undefined) {
                window.dispatchEvent(new Event('productsUpdated'));
                window.dispatchEvent(new Event('productsLoaded'));
                window.dispatchEvent(new CustomEvent('gn:productsUpdated', { detail: { products: updatedState.products } }));
            }
            if (updatedState.categories !== undefined) {
                window.dispatchEvent(new Event('categoriesUpdated'));
                window.dispatchEvent(new CustomEvent('gn:categoriesUpdated', { detail: { categories: updatedState.categories } }));
            }
            if (updatedState.reviews !== undefined) {
                window.dispatchEvent(new Event('reviewsUpdated'));
            }
            if (updatedState.announcements !== undefined) {
                window.dispatchEvent(new Event('announcementsUpdated'));
            }
            if (updatedState.hero_slides !== undefined) {
                window.dispatchEvent(new Event('heroSlidesUpdated'));
            }
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('gn:storeSyncUpdated', { detail: updatedState }));

            const bc = getStoreSyncBroadcastChannel();
            if (bc) {
                bc.postMessage({ type: 'STORE_SYNC_UPDATED', state: updatedState, timestamp: Date.now() });
            }
        } catch (e) {
            console.warn("Event dispatch notice:", e);
        }
    }

    window.SupabaseEngine = {
        client: supabase,
        isLive: !!supabase,

        // =========================================================================
        // PER-SECTION CLOUD SYNC — INDEPENDENT READ/WRITE
        // Each section stored in its own gn_orders row. No cross-contamination.
        // =========================================================================

        /**
         * One-time migration: reads the old monolithic __GN_STORE_SYNC__ row,
         * splits its data into 5 independent rows, then marks migration done.
         * Safe to call multiple times — only runs once per session.
         */
        async _migrateFromMonolith() {
            if (_migrationDone) return;
            _migrationDone = true;
            if (!this.isLive || !supabase) return;

            try {
                // Check if new-style rows already exist
                const { data: checkData } = await supabase
                    .from('gn_orders')
                    .select('customer_name')
                    .in('customer_name', Object.values(SECTION_CONFIG).map(c => c.syncName))
                    .limit(1);

                if (checkData && checkData.length > 0) {
                    // New rows already exist, migration already happened
                    return;
                }

                // Read the old monolithic row
                const CANONICAL_SYNC_ID = 'a29dc3da-0d01-4ba1-a1cf-d6f0ce82571e';
                let oldData = null;

                const { data: oldRow } = await supabase
                    .from('gn_orders')
                    .select('id, items')
                    .eq('id', CANONICAL_SYNC_ID)
                    .limit(1);

                if (oldRow && oldRow.length > 0 && oldRow[0].items) {
                    oldData = oldRow[0].items;
                } else {
                    // Try fallback lookup
                    const { data: fallbackRow } = await supabase
                        .from('gn_orders')
                        .select('id, items')
                        .eq('customer_name', '__GN_STORE_SYNC__')
                        .order('updated_at', { ascending: false })
                        .limit(1);
                    if (fallbackRow && fallbackRow.length > 0 && fallbackRow[0].items) {
                        oldData = fallbackRow[0].items;
                    }
                }

                if (!oldData) return; // No old data to migrate

                // Write each section to its own row
                for (const [sectionKey, config] of Object.entries(SECTION_CONFIG)) {
                    const sectionData = Array.isArray(oldData[sectionKey]) ? oldData[sectionKey] : config.defaultData;
                    if (sectionData.length === 0 && config.defaultData.length === 0) continue;

                    await supabase
                        .from('gn_orders')
                        .insert({
                            customer_name: config.syncName,
                            phone_number: '00000000000',
                            house_flat_no: 'SYSTEM',
                            street_address: 'SYSTEM',
                            city: 'SYSTEM',
                            province: 'SYSTEM',
                            nearest_landmark: 'SYSTEM',
                            payment_method: 'cod',
                            items: { [sectionKey]: sectionData, updated_at: new Date().toISOString() },
                            total_amount: 0,
                            status: 'Cancelled'
                        });

                    _sectionCache[sectionKey] = sectionData;
                    try { localStorage.setItem(config.localKey, JSON.stringify(sectionData)); } catch(e) {}
                }

                console.log("⚡ Gothic Nova: Migration from monolithic sync to per-section sync complete!");
            } catch (e) {
                console.warn("Migration notice:", e);
                _migrationDone = false; // Allow retry on next call
            }
        },

        /**
         * Read ONE section from its dedicated cloud row. Never touches other sections.
         * @param {string} sectionKey - 'products' | 'categories' | 'reviews' | 'announcements' | 'hero_slides'
         * @param {boolean} forceFresh - If true, bypass cache and read from cloud
         * @returns {Array} The section data array
         */
        async _getSection(sectionKey, forceFresh = false) {
            const config = SECTION_CONFIG[sectionKey];
            if (!config) return [];

            // Return cache if fresh
            if (!forceFresh && _sectionCache[sectionKey] !== null) {
                return _sectionCache[sectionKey];
            }

            if (!this.isLive || !supabase) {
                // Offline: read from localStorage
                try {
                    const raw = localStorage.getItem(config.localKey);
                    if (raw !== null) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            _sectionCache[sectionKey] = parsed;
                            return parsed;
                        }
                    }
                } catch(e) {}
                return config.defaultData;
            }

            // Ensure migration has happened
            await this._migrateFromMonolith();

            try {
                const { data, error } = await supabase
                    .from('gn_orders')
                    .select('id, items, updated_at')
                    .eq('customer_name', config.syncName)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                if (!error && Array.isArray(data) && data.length > 0 && data[0].items) {
                    const sectionData = Array.isArray(data[0].items[sectionKey])
                        ? data[0].items[sectionKey]
                        : [];

                    _sectionCache[sectionKey] = sectionData;
                    try { localStorage.setItem(config.localKey, JSON.stringify(sectionData)); } catch(e) {}
                    return sectionData;
                }
            } catch (e) {
                console.warn(`Notice: Fetching ${sectionKey} from cloud:`, e);
            }

            // Fallback to localStorage
            try {
                const raw = localStorage.getItem(config.localKey);
                if (raw !== null) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        _sectionCache[sectionKey] = parsed;
                        return parsed;
                    }
                }
            } catch(e) {}

            return config.defaultData;
        },

        /**
         * Write ONE section to its dedicated cloud row. Never touches other sections.
         * Uses a per-section sequential queue to prevent race conditions.
         * @param {string} sectionKey - 'products' | 'categories' | 'reviews' | 'announcements' | 'hero_slides'
         * @param {Array} data - The complete section data array to save
         */
        async _saveSection(sectionKey, data) {
            const config = SECTION_CONFIG[sectionKey];
            if (!config) return;
            if (!Array.isArray(data)) data = [];

            // 1. Update in-memory cache immediately
            _sectionCache[sectionKey] = data;

            // 2. Update localStorage immediately
            try { localStorage.setItem(config.localKey, JSON.stringify(data)); } catch(e) {}

            // 3. Dispatch events for this section only
            const eventPayload = { [sectionKey]: data };
            dispatchUniversalSyncEvents(eventPayload);

            // 4. Queue cloud write (sequential per-section, no cross-contamination)
            if (this.isLive && supabase) {
                _sectionSaveQueue[sectionKey] = _sectionSaveQueue[sectionKey].then(async () => {
                    try {
                        const payload = {
                            [sectionKey]: _sectionCache[sectionKey], // Always use latest cache
                            updated_at: new Date().toISOString()
                        };

                        // Try update first
                        const { data: updateResult, error: updateErr } = await supabase
                            .from('gn_orders')
                            .update({
                                items: payload,
                                updated_at: new Date().toISOString()
                            })
                            .eq('customer_name', config.syncName)
                            .select();

                        if (updateErr || !updateResult || updateResult.length === 0) {
                            // Row doesn't exist yet, insert
                            await supabase
                                .from('gn_orders')
                                .insert({
                                    customer_name: config.syncName,
                                    phone_number: '00000000000',
                                    house_flat_no: 'SYSTEM',
                                    street_address: 'SYSTEM',
                                    city: 'SYSTEM',
                                    province: 'SYSTEM',
                                    nearest_landmark: 'SYSTEM',
                                    payment_method: 'cod',
                                    items: payload,
                                    total_amount: 0,
                                    status: 'Cancelled'
                                });
                        }
                    } catch (e) {
                        console.warn(`Notice: Persisting ${sectionKey} to cloud:`, e);
                    }
                });
                await _sectionSaveQueue[sectionKey];
            }
        },

        /**
         * Backward-compatible pushAllToCloud. Saves each section independently.
         * Called from admin.html "Force Sync" button.
         */
        async pushAllToCloud(state = {}) {
            if (!state) state = {};

            const sections = {
                products: Array.isArray(state.products) && state.products.length > 0 ? state.products : null,
                categories: Array.isArray(state.categories) && state.categories.length > 0 ? state.categories : null,
                reviews: Array.isArray(state.reviews) && state.reviews.length > 0 ? state.reviews : null,
                announcements: Array.isArray(state.announcements) ? state.announcements : null,
                hero_slides: Array.isArray(state.hero_slides) && state.hero_slides.length > 0 ? state.hero_slides : null
            };

            for (const [key, data] of Object.entries(sections)) {
                if (data !== null) {
                    await this._saveSection(key, data);
                }
            }

            // Return combined state for backward compatibility
            return {
                products: _sectionCache.products || [],
                categories: _sectionCache.categories || [],
                reviews: _sectionCache.reviews || [],
                announcements: _sectionCache.announcements || [],
                hero_slides: _sectionCache.hero_slides || [],
                updated_at: new Date().toISOString(),
                version: 3
            };
        },

        /**
         * Backward-compatible _saveCloudSyncState. Routes to per-section saves.
         * Called from admin.html fallback code.
         */
        async _saveCloudSyncState(partial) {
            if (!partial || typeof partial !== 'object') return;
            const promises = [];
            for (const [key, config] of Object.entries(SECTION_CONFIG)) {
                if (partial[key] !== undefined && Array.isArray(partial[key])) {
                    promises.push(this._saveSection(key, partial[key]));
                }
            }
            await Promise.all(promises);
            return {
                products: _sectionCache.products || [],
                categories: _sectionCache.categories || [],
                reviews: _sectionCache.reviews || [],
                announcements: _sectionCache.announcements || [],
                hero_slides: _sectionCache.hero_slides || [],
                updated_at: new Date().toISOString(),
                version: 3
            };
        },

        /**
         * Backward-compatible _getCloudSyncState. Reads all sections independently.
         */
        async _getCloudSyncState(forceFresh = false) {
            const results = {};
            for (const key of Object.keys(SECTION_CONFIG)) {
                results[key] = await this._getSection(key, forceFresh);
            }
            return results;
        },

        // =========================================================================
        // 1. PRODUCTS API
        // =========================================================================
        async getProducts() {
            const products = await this._getSection('products');
            return Array.isArray(products) && products.length > 0 ? products : defaultCatalog;
        },

        async saveProduct(product) {
            const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
            const normalized = {
                id: String(product.id || Date.now()),
                name: (product.name || 'Gothic Artifact').trim(),
                category: (product.category || 'all').trim().toLowerCase(),
                price: Number(product.price || 0),
                sale_price: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                salePrice: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                stock: Number(product.stock !== undefined ? product.stock : 10),
                threshold: Number(product.threshold !== undefined ? product.threshold : 3),
                description: product.description || product.desc || '',
                desc: product.description || product.desc || '',
                img: product.img || 'assets/reaper_pendant.png',
                delivery_charges: product.delivery_charges !== undefined ? Number(product.delivery_charges) : 0,
                stock_images: stock_images,
                stockImages: stock_images,
                active: product.active !== false,
                display_order: Number(product.display_order || product.displayOrder || 1)
            };

            let list = await this._getSection('products');
            if (!Array.isArray(list)) list = [];

            const idx = list.findIndex(p => String(p.id) === String(normalized.id));
            if (idx >= 0) list[idx] = normalized;
            else list.push(normalized);

            await this._saveSection('products', list);

            // Best-effort write to gn_products table
            if (this.isLive && supabase) {
                try {
                    await supabase.from('gn_products').upsert({
                        id: normalized.id,
                        name: normalized.name,
                        category: normalized.category,
                        price: normalized.price,
                        sale_price: normalized.sale_price,
                        stock: normalized.stock,
                        threshold: normalized.threshold,
                        description: normalized.description,
                        img: normalized.img,
                        active: normalized.active,
                        display_order: normalized.display_order
                    });
                } catch(e) {}
            }

            return [normalized];
        },

        async deleteProduct(id) {
            const cleanId = String(id);
            let list = await this._getSection('products');
            if (!Array.isArray(list)) list = [];
            list = list.filter(p => String(p.id) !== cleanId);
            await this._saveSection('products', list);

            // Best-effort delete from gn_products table
            if (this.isLive && supabase) {
                try { await supabase.from('gn_products').delete().eq('id', cleanId); } catch(e) {}
            }
            return true;
        },

        async saveProductsBulk(productsArray) {
            const normalizedArray = (productsArray || []).map((product, idx) => {
                const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
                return {
                    id: String(product.id || (Date.now() + idx)),
                    name: (product.name || `Artifact #${idx + 1}`).trim(),
                    category: (product.category || 'all').trim().toLowerCase(),
                    price: Number(product.price || 0),
                    sale_price: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                    salePrice: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                    stock: Number(product.stock !== undefined ? product.stock : 10),
                    threshold: Number(product.threshold !== undefined ? product.threshold : 3),
                    description: product.description || product.desc || '',
                    desc: product.description || product.desc || '',
                    img: product.img || 'assets/reaper_pendant.png',
                    delivery_charges: product.delivery_charges !== undefined ? Number(product.delivery_charges) : 0,
                    stock_images: stock_images,
                    stockImages: stock_images,
                    active: product.active !== false,
                    display_order: Number(product.display_order || product.displayOrder || (idx + 1))
                };
            });
            await this._saveSection('products', normalizedArray);
            return normalizedArray;
        },

        // =========================================================================
        // 2. CATEGORIES API
        // =========================================================================
        async getCategories() {
            const cats = await this._getSection('categories');
            return Array.isArray(cats) && cats.length > 0 ? cats : defaultCategories;
        },

        async saveCategory(category) {
            const cleanSlug = String(category.id || category.slug || category.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const cleanName = (category.name || cleanSlug).trim();
            if (!cleanSlug) return null;

            const payload = {
                id: cleanSlug,
                name: cleanName,
                display_order: Number(category.display_order || 0)
            };

            let list = await this._getSection('categories');
            if (!Array.isArray(list)) list = [...defaultCategories];

            const idx = list.findIndex(c => String(c.id).toLowerCase() === cleanSlug);
            if (idx >= 0) list[idx] = { ...list[idx], ...payload };
            else list.push(payload);

            try { localStorage.setItem('gn_categories', JSON.stringify(list.map(c => c.id))); } catch(e) {}
            await this._saveSection('categories', list);
            return payload;
        },

        async saveCategoryList(categories) {
            if (!Array.isArray(categories)) return false;
            const cleanList = categories.filter(c => c && c.id && String(c.id).toLowerCase() !== 'general' && String(c.id).toLowerCase() !== 'all');
            try { localStorage.setItem('gn_categories', JSON.stringify(cleanList.map(c => c.id))); } catch(e) {}
            await this._saveSection('categories', cleanList);
            return true;
        },

        async deleteCategory(id) {
            const cleanId = String(id).trim().toLowerCase();

            // 1. Remove category from list
            let list = await this._getSection('categories');
            if (!Array.isArray(list)) list = [...defaultCategories];
            list = list.filter(c => c && String(c.id).toLowerCase() !== cleanId);

            try { localStorage.setItem('gn_categories', JSON.stringify(list.map(c => c.id))); } catch(e) {}
            await this._saveSection('categories', list);

            // 2. Reassign products with this category to 'all'
            let products = await this._getSection('products');
            if (Array.isArray(products) && products.length > 0) {
                let modified = false;
                products = products.map(p => {
                    if (p && String(p.category).trim().toLowerCase() === cleanId) {
                        modified = true;
                        return { ...p, category: 'all' };
                    }
                    return p;
                });
                if (modified) {
                    await this._saveSection('products', products);
                }
            }
            return true;
        },

        // =========================================================================
        // 3. CUSTOMER REVIEWS API
        // =========================================================================
        async getReviews() {
            const reviews = await this._getSection('reviews');
            return Array.isArray(reviews) ? reviews : [];
        },

        async saveReview(review) {
            const payload = {
                id: review.id || ('rev_' + Date.now()),
                author: review.author || review.customer_name || review.name || 'Verified Customer',
                customer_name: review.customer_name || review.author || review.name || 'Verified Customer',
                location: review.location || 'Pakistan',
                rating: Math.max(1, Math.min(5, Number(review.rating || review.stars || 5))),
                comment: review.comment || review.review_text || review.text || '',
                review_text: review.review_text || review.comment || review.text || '',
                product_name: review.product_name || review.productName || 'Gothic Artifact',
                is_sample: Boolean(review.is_sample || review.isSample || false)
            };

            let list = await this._getSection('reviews');
            if (!Array.isArray(list)) list = [];

            const idx = list.findIndex(r => String(r.id) === String(payload.id));
            if (idx >= 0) list[idx] = { ...list[idx], ...payload };
            else list.unshift(payload);

            await this._saveSection('reviews', list);
            return payload;
        },

        async deleteReview(id) {
            const cleanId = String(id);
            let list = await this._getSection('reviews');
            if (!Array.isArray(list)) list = [];
            list = list.filter(r => String(r.id) !== cleanId);
            await this._saveSection('reviews', list);
            return true;
        },

        // =========================================================================
        // 4. ANNOUNCEMENTS API
        // =========================================================================
        async getAnnouncements() {
            const ann = await this._getSection('announcements');
            return Array.isArray(ann) ? ann : [];
        },

        async saveAnnouncements(offers) {
            const cleanOffers = Array.isArray(offers) ? offers.map(o => String(o).trim()).filter(Boolean) : [];
            await this._saveSection('announcements', cleanOffers);
            return cleanOffers;
        },

        async saveStoreSetting(key, val) {
            if (key === 'announcements') {
                return await this.saveAnnouncements(val);
            }
            // For non-section settings, use localStorage only
            try { localStorage.setItem('gn_' + key, JSON.stringify(val)); } catch(e) {}
            return val;
        },

        async getStoreSetting(key) {
            if (key === 'announcements') {
                return await this.getAnnouncements();
            }
            try {
                const raw = localStorage.getItem('gn_' + key);
                if (raw) return JSON.parse(raw);
            } catch(e) {}
            return null;
        },

        // =========================================================================
        // 5. HERO SLIDER DROPS API
        // =========================================================================
        async getHeroSlides() {
            const slides = await this._getSection('hero_slides');
            return Array.isArray(slides) && slides.length > 0 ? slides : defaultHeroSlides;
        },

        async saveHeroSlide(slide) {
            const rawImg = slide.image_url || slide.img || slide.image || 'assets/hero_gothic_bg.png';
            const headline = slide.headline || slide.title || 'GOTHIC NOVA';
            const subtext = slide.subtext || slide.subtitle || 'Gothic × Japanese Jewelry.';
            const ctaText = slide.button_label || slide.buttonLabel || slide.cta_text || 'Explore Drop';
            const ctaLink = slide.button_link || slide.buttonLink || slide.cta_link || '#active-drop';
            const isActive = slide.active !== undefined ? slide.active : (slide.is_active !== false);

            const payload = {
                id: slide.id || ('s_' + Date.now()),
                headline: headline, title: headline,
                subtext: subtext, subtitle: subtext,
                button_label: ctaText, cta_text: ctaText,
                button_link: ctaLink, cta_link: ctaLink,
                img: rawImg, image_url: rawImg, image: rawImg,
                display_order: Number(slide.display_order || slide.displayOrder || 1),
                active: isActive, is_active: isActive
            };

            let list = await this._getSection('hero_slides');
            if (!Array.isArray(list)) list = [...defaultHeroSlides];

            const idx = list.findIndex(s => String(s.id) === String(payload.id));
            if (idx >= 0) list[idx] = payload;
            else list.push(payload);

            await this._saveSection('hero_slides', list);
            return payload;
        },

        async deleteHeroSlide(id) {
            let list = await this._getSection('hero_slides');
            if (!Array.isArray(list)) list = [...defaultHeroSlides];
            list = list.filter(s => String(s.id) !== String(id));
            await this._saveSection('hero_slides', list);
            return true;
        },

        // =========================================================================
        // 6. SUPABASE AUTH INTEGRATION
        // =========================================================================
        async signIn(email, password) {
            if (!this.isLive) {
                if (password === 'gothicnova51214' || password === 'admin') {
                    const mockSession = { user: { email: email || 'admin@gothicnova.com' }, token: 'mock-jwt-token' };
                    try { sessionStorage.setItem('gn_admin_session', JSON.stringify(mockSession)); } catch(e) {}
                    return { data: { session: mockSession, user: mockSession.user }, error: null };
                }
                return { data: null, error: { message: 'Invalid admin credentials.' } };
            }

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: (email || '').trim(),
                    password: password
                });
                if (error) throw error;
                if (data && data.session) {
                    try { sessionStorage.setItem('gn_admin_session', JSON.stringify(data.session)); } catch(e) {}
                }
                return { data, error: null };
            } catch (err) {
                return { data: null, error: err };
            }
        },

        async signOut() {
            try { sessionStorage.removeItem('gn_admin_session'); } catch(e) {}
            if (this.isLive && supabase) {
                try { await supabase.auth.signOut(); } catch (e) {}
            }
        },

        async getSession() {
            if (this.isLive && supabase) {
                try {
                    const { data } = await supabase.auth.getSession();
                    if (data && data.session) return data.session;
                } catch (e) {}
            }
            try {
                const stored = sessionStorage.getItem('gn_admin_session');
                if (stored) return JSON.parse(stored);
            } catch(e) {}
            return null;
        },

        // =========================================================================
        // 7. STORAGE MEDIA UPLOADS
        // =========================================================================
        _fileToDataUrl(fileOrBlob) {
            if (typeof fileOrBlob === 'string') return Promise.resolve(fileOrBlob);
            return new Promise((resolve) => {
                if (!fileOrBlob || typeof FileReader === 'undefined') { resolve(''); return; }
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(fileOrBlob);
            });
        },

        async uploadMedia(fileOrBase64, filename = '') {
            if (!this.isLive || !supabase) return fileOrBase64;

            try {
                let blob = fileOrBase64;
                if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
                    const byteString = atob(fileOrBase64.split(',')[1]);
                    const mimeString = fileOrBase64.split(',')[0].split(':')[1].split(';')[0];
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                    blob = new Blob([ab], { type: mimeString });
                }

                const cleanName = (filename || 'media_' + Date.now()).replace(/[^a-zA-Z0-9_.-]/g, '_');
                const path = `uploads/${Date.now()}_${cleanName}.webp`;

                const { error } = await supabase.storage
                    .from('product-media')
                    .upload(path, blob, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: 'image/webp'
                    });

                if (error) {
                    return fileOrBase64;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('product-media')
                    .getPublicUrl(path);

                return publicUrlData && publicUrlData.publicUrl ? publicUrlData.publicUrl : fileOrBase64;
            } catch (err) {
                return fileOrBase64;
            }
        },

        async uploadProductImage(file, path) {
            if (this.isLive && supabase) {
                try {
                    const fileExt = file && file.name ? file.name.split('.').pop() : 'png';
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = path ? `${path}/${fileName}` : fileName;

                    const { error } = await supabase.storage
                        .from('product-media')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) throw error;

                    const { data: publicUrlData } = supabase.storage
                        .from('product-media')
                        .getPublicUrl(filePath);

                    return publicUrlData.publicUrl;
                } catch (err) {
                    return await this._fileToDataUrl(file);
                }
            }
            return await this._fileToDataUrl(file);
        },

        async uploadPaymentScreenshot(fileOrBlob) {
            if (this.isLive && supabase) {
                try {
                    let fileToUpload = fileOrBlob;
                    let fileExt = 'webp';

                    if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
                        const mime = fileOrBlob.split(',')[0].split(':')[1].split(';')[0];
                        fileExt = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'webp');
                        const byteString = atob(fileOrBlob.split(',')[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                        fileToUpload = new Blob([ab], { type: mime });
                    } else if (fileOrBlob && fileOrBlob.name) {
                        fileExt = fileOrBlob.name.split('.').pop() || 'jpg';
                    }

                    const fileName = `slip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                    const filePath = `slips/${fileName}`;

                    const { error } = await supabase.storage
                        .from('payment_slips')
                        .upload(filePath, fileToUpload, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) {
                        const fallbackRes = await supabase.storage.from('product-media').upload(`payment_slips/${fileName}`, fileToUpload, { cacheControl: '3600', upsert: true });
                        if (!fallbackRes.error) {
                            const { data: fbUrl } = supabase.storage.from('product-media').getPublicUrl(`payment_slips/${fileName}`);
                            return fbUrl ? fbUrl.publicUrl : fileOrBlob;
                        }
                        throw error;
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from('payment_slips')
                        .getPublicUrl(filePath);

                    return publicUrlData && publicUrlData.publicUrl ? publicUrlData.publicUrl : await this._fileToDataUrl(fileOrBlob);
                } catch (err) {
                    return await this._fileToDataUrl(fileOrBlob);
                }
            }
            return await this._fileToDataUrl(fileOrBlob);
        },

        // =========================================================================
        // 8. ORDERS MANAGEMENT & PIPELINE
        // =========================================================================
        async createOrder(orderData) {
            const requiredFields = ['customer_name', 'phone_number', 'house_flat_no', 'street_address', 'city', 'province', 'nearest_landmark', 'payment_method'];
            for (const field of requiredFields) {
                if (!orderData[field] || !String(orderData[field]).trim()) {
                    throw new Error(`Missing required field: ${field.replace(/_/g, ' ')}`);
                }
            }

            if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
                throw new Error("Order must contain at least one item.");
            }

            if (orderData.payment_method === 'advance' && !orderData.payment_screenshot_url) {
                throw new Error("Advance payment requires a payment confirmation screenshot.");
            }

            const now = new Date().toISOString();
            const orderPayload = {
                customer_name: String(orderData.customer_name).trim(),
                phone_number: String(orderData.phone_number).trim(),
                house_flat_no: String(orderData.house_flat_no).trim(),
                street_address: String(orderData.street_address).trim(),
                city: String(orderData.city).trim(),
                province: String(orderData.province).trim(),
                nearest_landmark: String(orderData.nearest_landmark).trim(),
                payment_method: orderData.payment_method === 'advance' ? 'advance' : 'cod',
                payment_screenshot_url: orderData.payment_screenshot_url || null,
                items: orderData.items,
                total_amount: Number(orderData.total_amount || 0),
                advance_amount: orderData.advance_amount !== undefined ? Number(orderData.advance_amount) : (orderData.payment_method === 'advance' ? Number(orderData.total_amount || 0) : 700),
                deposit_paid: orderData.deposit_paid !== undefined ? Number(orderData.deposit_paid) : (orderData.payment_method === 'advance' ? Number(orderData.total_amount || 0) : 700),
                card_reward_applied: orderData.card_reward_applied || null,
                status: 'Pending',
                created_at: now,
                updated_at: now
            };

            let createdOrder = null;

            if (this.isLive && supabase) {
                try {
                    const cloudPayload = {
                        customer_name: orderPayload.customer_name,
                        phone_number: orderPayload.phone_number,
                        house_flat_no: orderPayload.house_flat_no,
                        street_address: orderPayload.street_address,
                        city: orderPayload.city,
                        province: orderPayload.province,
                        nearest_landmark: orderPayload.nearest_landmark,
                        payment_method: orderPayload.payment_method,
                        payment_screenshot_url: orderPayload.payment_screenshot_url,
                        items: orderPayload.items,
                        total_amount: orderPayload.total_amount,
                        status: orderPayload.status
                    };

                    const { data, error } = await supabase
                        .from('gn_orders')
                        .insert(cloudPayload)
                        .select();

                    if (error) throw error;
                    if (data && data.length > 0) {
                        createdOrder = { ...orderPayload, ...data[0] };
                    }
                } catch (err) {
                    console.warn("Supabase createOrder insert notice:", err);
                }
            }

            if (!createdOrder) {
                let currentCounter = Number(localStorage.getItem('gn_order_counter') || 0);
                currentCounter += 1;
                try { localStorage.setItem('gn_order_counter', String(currentCounter)); } catch(e) {}
                createdOrder = {
                    id: 'ord_' + Date.now(),
                    order_number: 1000 + currentCounter,
                    ...orderPayload
                };
            }

            // Update local orders list
            let localOrders = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) localOrders = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(localOrders)) localOrders = [];
            localOrders.unshift(createdOrder);
            try { localStorage.setItem('gn_orders', JSON.stringify(localOrders)); } catch(e) {}

            try {
                window.dispatchEvent(new Event('ordersUpdated'));
                const bc = getStoreSyncBroadcastChannel();
                if (bc) bc.postMessage({ type: 'ORDER_CREATED', order: createdOrder });
            } catch(e) {}

            return createdOrder;
        },

        async getOrders() {
            let deletedSet = new Set();
            try {
                const rawDel = localStorage.getItem('gn_deleted_orders');
                if (rawDel) JSON.parse(rawDel).forEach(id => deletedSet.add(String(id)));
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('gn_orders')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (!error && Array.isArray(data)) {
                        const localMap = {};
                        const localOrdersList = [];
                        try {
                            const rawLocal = localStorage.getItem('gn_orders');
                            if (rawLocal) {
                                JSON.parse(rawLocal).forEach(o => {
                                    if (o && (o.id || o.order_number)) {
                                        localMap[String(o.id || o.order_number)] = o;
                                        localOrdersList.push(o);
                                    }
                                });
                            }
                        } catch(e) {}

                        const remoteIds = new Set(data.map(o => String(o.id)));
                        const remoteOrderNums = new Set(data.map(o => String(o.order_number)));

                        // Strict filter: Exclude ONLY the system synchronization record
                        const validRemote = data.filter(o => {
                            if (!o) return false;
                            if (o.is_deleted || o.deleted_at || o.customer_name === '__TEST_DELETED__') return false;
                            if (o.customer_name && (o.customer_name === '__GN_STORE_SYNC__' || String(o.customer_name).startsWith('__GN_'))) return false;
                            if (deletedSet.has(String(o.id)) || deletedSet.has(String(o.order_number))) return false;
                            return true;
                        }).map(o => {
                            const cached = localMap[String(o.id || o.order_number)];
                            let merged = { ...o };
                            if (cached) {
                                if (cached.card_reward_applied && !o.card_reward_applied) merged.card_reward_applied = cached.card_reward_applied;
                                if (cached.status && cached.status !== o.status) {
                                    merged.status = cached.status;
                                }
                            }
                            return merged;
                        });

                        const localOnly = localOrdersList.filter(lo => 
                            lo && !deletedSet.has(String(lo.id)) && !deletedSet.has(String(lo.order_number)) &&
                            !remoteIds.has(String(lo.id)) && !remoteOrderNums.has(String(lo.order_number)) &&
                            !lo.is_deleted && !lo.deleted_at && lo.customer_name !== '__TEST_DELETED__' &&
                            !(lo.customer_name && (lo.customer_name === '__GN_STORE_SYNC__' || String(lo.customer_name).startsWith('__GN_')))
                        );

                        const combined = [...validRemote, ...localOnly];
                        try { localStorage.setItem('gn_orders', JSON.stringify(combined)); } catch(e) {}
                        return combined;
                    }
                } catch (e) {
                    console.warn("Supabase getOrders error, using local fallback:", e);
                }
            }

            // Fallback to local storage
            let cachedList = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) cachedList = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(cachedList)) cachedList = [];
            return cachedList.filter(o => o && !deletedSet.has(String(o.id)) && !deletedSet.has(String(o.order_number)) && !(o.customer_name && (o.customer_name === '__GN_STORE_SYNC__' || String(o.customer_name).startsWith('__GN_'))));
        },

        async deleteOrder(orderId) {
            let deletedSet = new Set();
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_orders') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(String(orderId));
                localStorage.setItem('gn_deleted_orders', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            let localOrders = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) localOrders = JSON.parse(raw);
            } catch(e) {}
            if (Array.isArray(localOrders)) {
                localOrders = localOrders.filter(o => String(o.id) !== String(orderId) && String(o.order_number) !== String(orderId));
                try { localStorage.setItem('gn_orders', JSON.stringify(localOrders)); } catch(e) {}
            }

            if (this.isLive && supabase) {
                try {
                    await supabase.from('gn_orders').delete().eq('id', orderId);
                    if (!isNaN(Number(orderId))) {
                        await supabase.from('gn_orders').delete().eq('id', Number(orderId));
                    }
                } catch (e) {}
            }

            try {
                window.dispatchEvent(new Event('ordersUpdated'));
                const bc = getStoreSyncBroadcastChannel();
                if (bc) bc.postMessage({ type: 'ORDER_DELETED', orderId });
            } catch(e) {}

            return true;
        },

        async updateOrderStatus(orderId, newStatus) {
            const now = new Date().toISOString();
            let localOrders = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) localOrders = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(localOrders)) localOrders = [];

            const idx = localOrders.findIndex(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
            if (idx >= 0) {
                localOrders[idx].status = newStatus;
                localOrders[idx].updated_at = now;
                try { localStorage.setItem('gn_orders', JSON.stringify(localOrders)); } catch(e) {}
            }

            if (this.isLive && supabase) {
                try {
                    await supabase.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('id', orderId);
                    if (!isNaN(Number(orderId))) {
                        await supabase.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('id', Number(orderId));
                    }
                } catch (e) {}
            }

            try {
                window.dispatchEvent(new Event('ordersUpdated'));
                const bc = getStoreSyncBroadcastChannel();
                if (bc) bc.postMessage({ type: 'ORDER_STATUS_UPDATED', orderId, status: newStatus });
            } catch(e) {}

            return idx >= 0 ? localOrders[idx] : null;
        },

        // =========================================================================
        // 9. REALTIME SUBSCRIPTIONS
        // =========================================================================
        subscribeRealtime(callback) {
            if (!this.isLive || !supabase) return null;

            try {
                const self = this;
                const channel = supabase
                    .channel('gn-universal-realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_orders' }, payload => {
                        const rec = payload.new || payload.old;
                        if (rec && rec.customer_name) {
                            const name = rec.customer_name;
                            // Check if it's one of our sync rows
                            for (const [sectionKey, config] of Object.entries(SECTION_CONFIG)) {
                                if (name === config.syncName) {
                                    // Re-fetch just this section
                                    self._getSection(sectionKey, true).then(freshData => {
                                        dispatchUniversalSyncEvents({ [sectionKey]: freshData });
                                    });
                                    if (callback) callback({ type: sectionKey, payload });
                                    return;
                                }
                            }
                            // Legacy monolithic sync row
                            if (name === '__GN_STORE_SYNC__' || name.startsWith('__GN_')) {
                                return; // Ignore legacy rows
                            }
                            // Regular order
                            window.dispatchEvent(new Event('ordersUpdated'));
                        }
                        if (callback) callback({ type: 'order', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_products' }, payload => {
                        window.dispatchEvent(new Event('productsUpdated'));
                        if (callback) callback({ type: 'product', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_categories' }, payload => {
                        window.dispatchEvent(new Event('categoriesUpdated'));
                        if (callback) callback({ type: 'category', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_reviews' }, payload => {
                        window.dispatchEvent(new Event('reviewsUpdated'));
                        if (callback) callback({ type: 'review', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_hero_slides' }, payload => {
                        window.dispatchEvent(new Event('heroSlidesUpdated'));
                        if (callback) callback({ type: 'hero_slide', payload });
                    })
                    .subscribe();

                return channel;
            } catch (e) {
                console.warn("Realtime subscription notice:", e);
                return null;
            }
        },

        // Backward compatibility mock methods
        _getMockProducts() { return defaultCatalog; },
        _getMockCategories() { return defaultCategories; },
        _getMockReviews() { return []; },
        _getMockHeroSlides() { return defaultHeroSlides; },
        _getMockOrders() { return []; }
    };

    // Auto-trigger initial data load (single entry point, no duplicates)
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                // Run migration first, then load all sections in parallel
                await window.SupabaseEngine._migrateFromMonolith();
                await Promise.all([
                    window.SupabaseEngine.getProducts(),
                    window.SupabaseEngine.getCategories(),
                    window.SupabaseEngine.getReviews(),
                    window.SupabaseEngine.getHeroSlides(),
                    window.SupabaseEngine.getAnnouncements()
                ]);
                window.dispatchEvent(new Event('productsLoaded'));
            } catch (e) {}
        });
    }

    // =========================================================================
    // 10. LUXURY DIALOG SYSTEM
    // =========================================================================
    function getOrCreateLuxuryDialogContainer() {
        if (typeof document === 'undefined') return null;
        let container = document.getElementById('gn-dialog-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'gn-dialog-overlay';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9999999;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;opacity:0;transition:opacity 0.25s ease;';
            container.innerHTML = `
                <div id="gn-dialog-box" style="background:#11070d;border:1px solid rgba(138,26,46,0.65);border-radius:6px;width:100%;max-width:440px;padding:24px 28px;box-shadow:0 20px 60px rgba(0,0,0,0.95),0 0 30px rgba(92,15,31,0.35);display:flex;flex-direction:column;gap:16px;transform:scale(0.95);transition:transform 0.25s cubic-bezier(0.16,1,0.3,1);box-sizing:border-box;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-family:'Cinzel',serif;font-size:0.95rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#ffe8be;" id="gn-dialog-title">GOTHIC NOVA</span>
                        <span style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;color:#a89a9d;letter-spacing:0.1em;">ARTIFACT NOTICE</span>
                    </div>
                    <p id="gn-dialog-msg" style="font-family:'Inter',sans-serif;font-size:0.88rem;line-height:1.55;color:#dedede;margin:0;word-break:break-word;"></p>
                    <div id="gn-dialog-actions" style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
                        <button type="button" id="gn-dialog-cancel-btn" style="display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#b0a5a8;font-family:'JetBrains Mono',monospace;font-size:0.76rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:3px;cursor:pointer;">Cancel</button>
                        <button type="button" id="gn-dialog-confirm-btn" style="background:linear-gradient(135deg,#a81e37 0%,#6e0d1f 100%);border:1px solid #ff3b5c;color:#ffffff;font-family:'JetBrains Mono',monospace;font-size:0.76rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:9px 20px;border-radius:3px;cursor:pointer;box-shadow:0 4px 16px rgba(138,26,46,0.4);">Acknowledge</button>
                    </div>
                </div>
            `;
            if (document.body) {
                document.body.appendChild(container);
            } else {
                window.addEventListener('DOMContentLoaded', () => document.body.appendChild(container));
            }
        }
        return container;
    }

    if (typeof window !== 'undefined') {
        window.showLuxuryAlert = function(msg, title = 'GOTHIC NOVA', onConfirm) {
            const overlay = getOrCreateLuxuryDialogContainer();
            if (!overlay) return;
            const box = document.getElementById('gn-dialog-box');
            const titleEl = document.getElementById('gn-dialog-title');
            const msgEl = document.getElementById('gn-dialog-msg');
            const cancelBtn = document.getElementById('gn-dialog-cancel-btn');
            const confirmBtn = document.getElementById('gn-dialog-confirm-btn');

            if (titleEl) titleEl.textContent = title;
            if (msgEl) msgEl.textContent = String(msg || '');
            if (cancelBtn) cancelBtn.style.display = 'none';

            function closeDialog() {
                overlay.style.opacity = '0';
                if (box) box.style.transform = 'scale(0.95)';
                setTimeout(() => { overlay.style.display = 'none'; }, 220);
                if (typeof onConfirm === 'function') onConfirm();
            }

            if (confirmBtn) {
                confirmBtn.textContent = 'ACKNOWLEDGE';
                confirmBtn.onclick = closeDialog;
            }

            overlay.onclick = function(e) {
                if (e.target === overlay) closeDialog();
            };

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                if (box) box.style.transform = 'scale(1)';
            });

            if (title === 'COPIED' || title === 'NOTIFICATION' || title === 'COPIED TO CLIPBOARD') {
                setTimeout(() => {
                    if (overlay.style.display === 'flex') closeDialog();
                }, 1800);
            }
        };

        window.showLuxuryConfirm = function({ title = 'GOTHIC NOVA', message, confirmText = 'Confirm', isDanger = true, onConfirm, onCancel }) {
            const overlay = getOrCreateLuxuryDialogContainer();
            if (!overlay) return;
            const box = document.getElementById('gn-dialog-box');
            const titleEl = document.getElementById('gn-dialog-title');
            const msgEl = document.getElementById('gn-dialog-msg');
            const cancelBtn = document.getElementById('gn-dialog-cancel-btn');
            const confirmBtn = document.getElementById('gn-dialog-confirm-btn');

            function closeDialog() {
                overlay.style.opacity = '0';
                if (box) box.style.transform = 'scale(0.95)';
                setTimeout(() => { overlay.style.display = 'none'; }, 220);
            }

            if (titleEl) titleEl.textContent = title;
            if (msgEl) msgEl.textContent = String(message || '');
            if (cancelBtn) {
                cancelBtn.style.display = 'inline-block';
                cancelBtn.onclick = function() {
                    closeDialog();
                    if (typeof onCancel === 'function') onCancel();
                };
            }
            if (confirmBtn) {
                confirmBtn.textContent = confirmText.toUpperCase();
                if (isDanger) {
                    confirmBtn.style.background = 'linear-gradient(135deg, #a81e37 0%, #6e0d1f 100%)';
                    confirmBtn.style.borderColor = '#ff3b5c';
                    confirmBtn.style.color = '#ffffff';
                } else {
                    confirmBtn.style.background = '#ffffff';
                    confirmBtn.style.borderColor = '#ffffff';
                    confirmBtn.style.color = '#000000';
                }
                confirmBtn.onclick = function() {
                    overlay.style.opacity = '0';
                    if (box) box.style.transform = 'scale(0.95)';
                    setTimeout(() => { overlay.style.display = 'none'; }, 220);
                    if (onConfirm) onConfirm();
                };
            }

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                if (box) box.style.transform = 'scale(1)';
            });
        };

        window.alert = function(msg) {
            window.showLuxuryAlert(msg);
        };
    }
})();
