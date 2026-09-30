// supabase-engine.js
// GOTHIC NOVA - Enterprise Dual-Mode & Live Supabase Data Adapter
// Seamlessly bridges Supabase PostgreSQL Cloud & LocalStorage fallback
// Unified Master State Document in gn_orders (__GN_STORE_SYNC__)

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

    // Concurrency & Debounce Controls
    let _cachedSyncState = null;
    let _syncSavePromiseChain = Promise.resolve();
    let _pendingSavePayload = {};
    let _saveDebounceTimeout = null;

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
        // CLOUD STORE STATE SYNCHRONIZATION ENGINE
        // Guarantees real-time cross-device sync for products, reviews, announcements,
        // categories, and hero slides using Supabase cloud storage with zero RLS barriers.
        // =========================================================================
        async _getCloudSyncState(forceFresh = false) {
            if (!this.isLive || !supabase) {
                return _cachedSyncState;
            }
            if (!forceFresh && _cachedSyncState && Array.isArray(_cachedSyncState.products) && _cachedSyncState.products.length > 0) {
                return _cachedSyncState;
            }

            try {
                const { data, error } = await supabase
                    .from('gn_orders')
                    .select('id, items, updated_at')
                    .eq('customer_name', '__GN_STORE_SYNC__')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (!error && Array.isArray(data) && data.length > 0 && data[0] && data[0].items) {
                    const rawItems = data[0].items;
                    _cachedSyncState = {
                        syncRecordId: data[0].id,
                        products: Array.isArray(rawItems.products) ? rawItems.products : (_cachedSyncState?.products || []),
                        categories: Array.isArray(rawItems.categories) ? rawItems.categories : (_cachedSyncState?.categories || defaultCategories),
                        reviews: Array.isArray(rawItems.reviews) ? rawItems.reviews : (_cachedSyncState?.reviews || []),
                        announcements: Array.isArray(rawItems.announcements) ? rawItems.announcements : (_cachedSyncState?.announcements || []),
                        hero_slides: Array.isArray(rawItems.hero_slides) ? rawItems.hero_slides : (_cachedSyncState?.hero_slides || []),
                        updated_at: data[0].updated_at || rawItems.updated_at || Date.now(),
                        version: 2
                    };
                    return _cachedSyncState;
                }
            } catch (e) {
                console.warn("Notice: Fetching cloud sync state:", e);
            }
            return _cachedSyncState;
        },

        async _saveCloudSyncState(partial) {
            if (!partial || typeof partial !== 'object') partial = {};

            // 1. Fetch fresh cloud state if memory is empty
            let current = _cachedSyncState;
            if (!current || (!current.products && !current.categories && !current.reviews)) {
                try {
                    current = await this._getCloudSyncState(true);
                } catch(e) {}
            }

            // 2. Safe field extraction that prioritizes partial update, then fresh cloud state, then memory, then localStorage
            const getSafeDataset = (key, storageKey, fallback = []) => {
                if (partial[key] !== undefined) return partial[key];
                if (current && Array.isArray(current[key]) && current[key].length > 0) return current[key];
                if (_cachedSyncState && Array.isArray(_cachedSyncState[key]) && _cachedSyncState[key].length > 0) return _cachedSyncState[key];
                try {
                    const raw = localStorage.getItem(storageKey);
                    if (raw !== null) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                    }
                } catch(e) {}
                if (current && Array.isArray(current[key])) return current[key];
                return fallback;
            };

            const safeProducts = getSafeDataset('products', 'gn_products', []);
            const safeCategories = getSafeDataset('categories', 'gn_categories_meta', defaultCategories);
            const safeReviews = getSafeDataset('reviews', 'gn_reviews', []);
            const safeAnnouncements = getSafeDataset('announcements', 'gn_announcements', []);
            const safeHeroSlides = getSafeDataset('hero_slides', 'gn_hero_slides', []);

            _cachedSyncState = {
                syncRecordId: current?.syncRecordId || _cachedSyncState?.syncRecordId,
                products: safeProducts,
                categories: safeCategories,
                reviews: safeReviews,
                announcements: safeAnnouncements,
                hero_slides: safeHeroSlides,
                updated_at: Date.now(),
                version: 2
            };

            _pendingSavePayload = {
                ..._pendingSavePayload,
                ...partial
            };

            // Dispatch instant local feedback across all tabs on current device
            dispatchUniversalSyncEvents(partial);

            // Queue the cloud persist sequentially to eliminate race conditions
            return new Promise((resolve) => {
                if (_saveDebounceTimeout) clearTimeout(_saveDebounceTimeout);
                _saveDebounceTimeout = setTimeout(() => {
                    _syncSavePromiseChain = _syncSavePromiseChain.then(async () => {
                        const payloadToSave = { ..._pendingSavePayload };
                        _pendingSavePayload = {};
                        try {
                            const freshCloud = await this._getCloudSyncState(true);
                            const merged = {
                                products: payloadToSave.products !== undefined 
                                    ? payloadToSave.products 
                                    : (freshCloud && Array.isArray(freshCloud.products) && freshCloud.products.length > 0 ? freshCloud.products : safeProducts),
                                categories: payloadToSave.categories !== undefined 
                                    ? payloadToSave.categories 
                                    : (freshCloud && Array.isArray(freshCloud.categories) && freshCloud.categories.length > 0 ? freshCloud.categories : safeCategories),
                                reviews: payloadToSave.reviews !== undefined 
                                    ? payloadToSave.reviews 
                                    : (freshCloud && Array.isArray(freshCloud.reviews) && freshCloud.reviews.length > 0 ? freshCloud.reviews : safeReviews),
                                announcements: payloadToSave.announcements !== undefined 
                                    ? payloadToSave.announcements 
                                    : (freshCloud && Array.isArray(freshCloud.announcements) && freshCloud.announcements.length > 0 ? freshCloud.announcements : safeAnnouncements),
                                hero_slides: payloadToSave.hero_slides !== undefined 
                                    ? payloadToSave.hero_slides 
                                    : (freshCloud && Array.isArray(freshCloud.hero_slides) && freshCloud.hero_slides.length > 0 ? freshCloud.hero_slides : safeHeroSlides),
                                updated_at: new Date().toISOString(),
                                version: 2
                            };

                            // Ultimate Anti-Clobber Safeguard:
                            // If a partial save did NOT pass products, but merged.products ended up empty while freshCloud had products, restore them!
                            if (payloadToSave.products === undefined && (!merged.products || merged.products.length === 0) && freshCloud && Array.isArray(freshCloud.products) && freshCloud.products.length > 0) {
                                merged.products = freshCloud.products;
                            }
                            if (payloadToSave.categories === undefined && (!merged.categories || merged.categories.length === 0) && freshCloud && Array.isArray(freshCloud.categories) && freshCloud.categories.length > 0) {
                                merged.categories = freshCloud.categories;
                            }
                            if (payloadToSave.reviews === undefined && (!merged.reviews || merged.reviews.length === 0) && freshCloud && Array.isArray(freshCloud.reviews) && freshCloud.reviews.length > 0) {
                                merged.reviews = freshCloud.reviews;
                            }
                            if (payloadToSave.announcements === undefined && (!merged.announcements || merged.announcements.length === 0) && freshCloud && Array.isArray(freshCloud.announcements) && freshCloud.announcements.length > 0) {
                                merged.announcements = freshCloud.announcements;
                            }

                            if (this.isLive && supabase) {
                                let savedSuccessfully = false;
                                const syncRecordId = freshCloud?.syncRecordId || _cachedSyncState?.syncRecordId;
                                if (syncRecordId) {
                                    try {
                                        const { error: updateErr } = await supabase
                                            .from('gn_orders')
                                            .update({ items: merged, updated_at: new Date().toISOString() })
                                            .eq('id', syncRecordId);
                                        if (!updateErr) savedSuccessfully = true;
                                    } catch (e) {}
                                }

                                if (!savedSuccessfully) {
                                    try {
                                        const { data, error: insertErr } = await supabase
                                            .from('gn_orders')
                                            .insert({
                                                customer_name: '__GN_STORE_SYNC__',
                                                phone_number: '00000000000',
                                                house_flat_no: 'SYSTEM',
                                                street_address: 'SYSTEM',
                                                city: 'SYSTEM',
                                                province: 'SYSTEM',
                                                nearest_landmark: 'SYSTEM',
                                                payment_method: 'cod',
                                                items: merged,
                                                total_amount: 0,
                                                status: 'Cancelled'
                                            })
                                            .select();
                                        if (!insertErr && data && data[0]) {
                                            if (_cachedSyncState) _cachedSyncState.syncRecordId = data[0].id;
                                            savedSuccessfully = true;
                                        }
                                    } catch (e) {}
                                }
                            }
                            resolve(merged);
                        } catch (err) {
                            console.warn("Notice: Persisting cloud sync state:", err);
                            resolve(_cachedSyncState);
                        }
                    });
                }, 100);
            });
        },

        async pushAllToCloud(state = {}) {
            if (!state) state = {};
            const freshCloud = await this._getCloudSyncState(true);

            const resolveDataset = (provided, storageKey, cloudKey, fallback = []) => {
                if (Array.isArray(provided) && provided.length > 0) return provided;
                try {
                    const raw = localStorage.getItem(storageKey);
                    if (raw !== null) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                    }
                } catch(e) {}
                if (freshCloud && Array.isArray(freshCloud[cloudKey]) && freshCloud[cloudKey].length > 0) {
                    return freshCloud[cloudKey];
                }
                return Array.isArray(provided) ? provided : fallback;
            };

            const currentProducts = resolveDataset(state.products, 'gn_products', 'products', []);
            const currentCats = resolveDataset(state.categories, 'gn_categories_meta', 'categories', defaultCategories);
            const currentRevs = resolveDataset(state.reviews, 'gn_reviews', 'reviews', []);
            const currentAnn = resolveDataset(state.announcements, 'gn_announcements', 'announcements', []);
            const currentHero = resolveDataset(state.hero_slides, 'gn_hero_slides', 'hero_slides', []);

            const masterPayload = {
                products: currentProducts,
                categories: currentCats,
                reviews: currentRevs,
                announcements: currentAnn,
                hero_slides: currentHero,
                updated_at: new Date().toISOString(),
                version: 2
            };

            try { localStorage.setItem('gn_products', JSON.stringify(currentProducts)); } catch(e) {}
            try { localStorage.setItem('gn_categories_meta', JSON.stringify(currentCats)); } catch(e) {}
            try { localStorage.setItem('gn_reviews', JSON.stringify(currentRevs)); } catch(e) {}
            try { localStorage.setItem('gn_announcements', JSON.stringify(currentAnn)); } catch(e) {}

            _cachedSyncState = { ...masterPayload };
            dispatchUniversalSyncEvents(masterPayload);

            if (this.isLive && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('gn_orders')
                        .insert({
                            customer_name: '__GN_STORE_SYNC__',
                            phone_number: '00000000000',
                            house_flat_no: 'SYSTEM',
                            street_address: 'SYSTEM',
                            city: 'SYSTEM',
                            province: 'SYSTEM',
                            nearest_landmark: 'SYSTEM',
                            payment_method: 'cod',
                            items: masterPayload,
                            total_amount: 0,
                            status: 'Cancelled'
                        })
                        .select();
                    if (!error && data && data[0]) {
                        _cachedSyncState.syncRecordId = data[0].id;
                        console.log("⚡ Gothic Nova Cloud Sync: Master state successfully published to Supabase Cloud!", data[0].id);
                    }
                } catch (cloudErr) {
                    console.warn("Supabase push notice:", cloudErr);
                }
            }

            return masterPayload;
        },

        // =========================================================================
        // 1. PRODUCTS API
        // =========================================================================
        async getProducts() {
            let localProds = null;
            try {
                const rawLocal = localStorage.getItem('gn_products');
                if (rawLocal !== null) {
                    const parsed = JSON.parse(rawLocal);
                    if (Array.isArray(parsed)) localProds = parsed;
                }
            } catch (e) {}

            if (this.isLive && supabase) {
                try {
                    // 1. Primary: Unified Cloud Sync Document
                    const cloudState = await this._getCloudSyncState();
                    if (cloudState && Array.isArray(cloudState.products)) {
                        const cloudProds = cloudState.products;
                        try { localStorage.setItem('gn_products', JSON.stringify(cloudProds)); } catch(e) {}
                        return cloudProds;
                    }

                    // 2. Secondary: Check gn_products table directly
                    const { data, error } = await supabase
                        .from('gn_products')
                        .select('*')
                        .order('display_order', { ascending: true })
                        .order('created_at', { ascending: true });
                    
                    if (!error && Array.isArray(data) && data.length > 0) {
                        const normalized = data.map(p => ({
                            ...p,
                            salePrice: p.sale_price !== undefined ? p.sale_price : p.salePrice,
                            sale_price: p.sale_price !== undefined ? p.sale_price : p.salePrice
                        }));
                        try { localStorage.setItem('gn_products', JSON.stringify(normalized)); } catch(e) {}
                        this._saveCloudSyncState({ products: normalized }).catch(() => {});
                        return normalized;
                    }
                } catch (err) {
                    console.warn("Supabase fetch products notice:", err);
                }
            }

            // If local storage exists (even if [] empty array), respect it (Anti-Ghost)
            if (Array.isArray(localProds)) {
                return localProds;
            }

            // Only seed on initial cold start when nothing exists anywhere
            const initialSeed = defaultCatalog;
            try { localStorage.setItem('gn_products', JSON.stringify(initialSeed)); } catch(e) {}
            if (this.isLive && supabase) {
                this._saveCloudSyncState({ products: initialSeed }).catch(() => {});
            }
            return initialSeed;
        },

        async saveProduct(product) {
            const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
            const normalized = {
                id: String(product.id || Date.now()),
                name: (product.name || 'Gothic Artifact').trim(),
                category: (product.category || 'rings').trim().toLowerCase(),
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

            // 1. Update local cache
            let localList = [];
            try {
                const stored = localStorage.getItem('gn_products');
                if (stored) localList = JSON.parse(stored);
            } catch(e) {}
            if (!Array.isArray(localList)) localList = [];

            const idx = localList.findIndex(p => String(p.id) === String(normalized.id));
            if (idx >= 0) localList[idx] = normalized;
            else localList.push(normalized);

            try { localStorage.setItem('gn_products', JSON.stringify(localList)); } catch(e) {}

            // 2. Persist to Master Cloud State
            await this._saveCloudSyncState({ products: localList });

            // 3. Best-effort write to gn_products table (if table exists and writable)
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
            let localList = [];
            try {
                const stored = localStorage.getItem('gn_products');
                if (stored) localList = JSON.parse(stored);
            } catch(e) {}
            if (!Array.isArray(localList)) localList = [];

            localList = localList.filter(p => String(p.id) !== cleanId);
            try { localStorage.setItem('gn_products', JSON.stringify(localList)); } catch(e) {}

            // Record in deleted registry
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_products') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(cleanId);
                localStorage.setItem('gn_deleted_products', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            // Persist to Master Cloud State
            await this._saveCloudSyncState({ products: localList });

            // Best-effort delete from gn_products
            if (this.isLive && supabase) {
                try {
                    await supabase.from('gn_products').delete().eq('id', cleanId);
                } catch (err) {}
            }

            return true;
        },

        async saveProductsBulk(productsArray) {
            const normalizedArray = (productsArray || []).map((product, idx) => {
                const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
                return {
                    id: String(product.id || (Date.now() + idx)),
                    name: (product.name || `Artifact #${idx + 1}`).trim(),
                    category: (product.category || 'rings').trim().toLowerCase(),
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

            try { localStorage.setItem('gn_products', JSON.stringify(normalizedArray)); } catch(e) {}
            await this._saveCloudSyncState({ products: normalizedArray });
            return normalizedArray;
        },

        // =========================================================================
        // 2. CATEGORIES API
        // =========================================================================
        async getCategories() {
            let localCats = null;
            try {
                const raw = localStorage.getItem('gn_categories_meta');
                if (raw !== null) localCats = JSON.parse(raw);
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const cloudState = await this._getCloudSyncState();
                    if (cloudState && Array.isArray(cloudState.categories)) {
                        try { localStorage.setItem('gn_categories_meta', JSON.stringify(cloudState.categories)); } catch(e) {}
                        return cloudState.categories;
                    }
                } catch (err) {
                    console.warn("Notice: Fetching categories:", err);
                }
            }

            if (Array.isArray(localCats)) return localCats;

            try { localStorage.setItem('gn_categories_meta', JSON.stringify(defaultCategories)); } catch(e) {}
            return defaultCategories;
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

            let localCats = [];
            try {
                const stored = localStorage.getItem('gn_categories_meta');
                if (stored !== null) localCats = JSON.parse(stored);
            } catch(e) {}
            if (!Array.isArray(localCats)) localCats = defaultCategories;

            const idx = localCats.findIndex(c => String(c.id).toLowerCase() === cleanSlug);
            if (idx >= 0) localCats[idx] = { ...localCats[idx], ...payload };
            else localCats.push(payload);

            try { localStorage.setItem('gn_categories_meta', JSON.stringify(localCats)); } catch(e) {}
            await this._saveCloudSyncState({ categories: localCats });
            return payload;
        },

        async deleteCategory(id) {
            const cleanId = String(id).trim().toLowerCase();
            let localCats = [];
            try {
                const stored = localStorage.getItem('gn_categories_meta');
                if (stored !== null) localCats = JSON.parse(stored);
            } catch(e) {}
            if (!Array.isArray(localCats)) localCats = defaultCategories;
            
            localCats = localCats.filter(c => String(c.id).toLowerCase() !== cleanId);
            try { localStorage.setItem('gn_categories_meta', JSON.stringify(localCats)); } catch(e) {}

            await this._saveCloudSyncState({ categories: localCats });
            return true;
        },

        // =========================================================================
        // 3. CUSTOMER REVIEWS API (Strict Anti-Ghost)
        // =========================================================================
        async getReviews() {
            let localRevs = null;
            try {
                const raw = localStorage.getItem('gn_reviews');
                if (raw !== null) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) localRevs = parsed;
                }
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const cloudState = await this._getCloudSyncState();
                    if (cloudState && Array.isArray(cloudState.reviews)) {
                        try { localStorage.setItem('gn_reviews', JSON.stringify(cloudState.reviews)); } catch(e) {}
                        return cloudState.reviews;
                    }
                } catch(e) {
                    console.warn("Notice: Fetching reviews from cloud:", e);
                }
            }

            // Anti-Ghost: If local storage has [] (empty array), return it! NEVER inject 8 sample reviews!
            if (Array.isArray(localRevs)) {
                return localRevs;
            }

            // Cold start default (first install only)
            return [];
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

            let local = [];
            try {
                const raw = localStorage.getItem('gn_reviews');
                if (raw !== null) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) local = parsed;
                }
            } catch(e) {}

            const idx = local.findIndex(r => String(r.id) === String(payload.id));
            if (idx >= 0) local[idx] = { ...local[idx], ...payload };
            else local.unshift(payload);

            try { localStorage.setItem('gn_reviews', JSON.stringify(local)); } catch(e) {}
            await this._saveCloudSyncState({ reviews: local });
            return payload;
        },

        async deleteReview(id) {
            const cleanId = String(id);
            let local = [];
            try {
                const raw = localStorage.getItem('gn_reviews');
                if (raw !== null) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) local = parsed;
                }
            } catch(e) {}

            local = local.filter(r => String(r.id) !== cleanId);
            try { localStorage.setItem('gn_reviews', JSON.stringify(local)); } catch(e) {}

            // Persist to deleted registry
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_reviews') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(cleanId);
                localStorage.setItem('gn_deleted_reviews', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            await this._saveCloudSyncState({ reviews: local });
            return true;
        },

        // =========================================================================
        // 4. ANNOUNCEMENTS API
        // =========================================================================
        async getAnnouncements() {
            let localAnn = null;
            try {
                const raw = localStorage.getItem('gn_announcements');
                if (raw !== null) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) localAnn = parsed;
                }
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const cloudState = await this._getCloudSyncState();
                    if (cloudState && Array.isArray(cloudState.announcements)) {
                        try { localStorage.setItem('gn_announcements', JSON.stringify(cloudState.announcements)); } catch(e) {}
                        return cloudState.announcements;
                    }
                } catch(e) {}
            }

            if (Array.isArray(localAnn)) return localAnn;
            return [];
        },

        async saveAnnouncements(offers) {
            const cleanOffers = Array.isArray(offers) ? offers.map(o => String(o).trim()).filter(Boolean) : [];
            try { localStorage.setItem('gn_announcements', JSON.stringify(cleanOffers)); } catch(e) {}
            await this._saveCloudSyncState({ announcements: cleanOffers });
            return cleanOffers;
        },

        async saveStoreSetting(key, val) {
            if (key === 'announcements') {
                return await this.saveAnnouncements(val);
            }
            try {
                localStorage.setItem('gn_' + key, JSON.stringify(val));
            } catch(e) {}
            await this._saveCloudSyncState({ [key]: val });
            return val;
        },

        async getStoreSetting(key) {
            if (key === 'announcements') {
                return await this.getAnnouncements();
            }
            const cloudState = await this._getCloudSyncState();
            if (cloudState && cloudState[key] !== undefined) {
                return cloudState[key];
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
            let localSlides = null;
            try {
                const raw = localStorage.getItem('gn_hero_slides');
                if (raw !== null) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) localSlides = parsed;
                }
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const cloudState = await this._getCloudSyncState();
                    if (cloudState && Array.isArray(cloudState.hero_slides)) {
                        try { localStorage.setItem('gn_hero_slides', JSON.stringify(cloudState.hero_slides)); } catch(e) {}
                        return cloudState.hero_slides;
                    }
                } catch(e) {}
            }

            if (Array.isArray(localSlides)) return localSlides;
            try { localStorage.setItem('gn_hero_slides', JSON.stringify(defaultHeroSlides)); } catch(e) {}
            return defaultHeroSlides;
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
                headline: headline,
                title: headline,
                subtext: subtext,
                subtitle: subtext,
                button_label: ctaText,
                cta_text: ctaText,
                button_link: ctaLink,
                cta_link: ctaLink,
                img: rawImg,
                image_url: rawImg,
                image: rawImg,
                display_order: Number(slide.display_order || slide.displayOrder || 1),
                active: isActive,
                is_active: isActive
            };

            let local = [];
            try {
                const raw = localStorage.getItem('gn_hero_slides');
                if (raw) local = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(local)) local = defaultHeroSlides;

            const idx = local.findIndex(s => String(s.id) === String(payload.id));
            if (idx >= 0) local[idx] = payload;
            else local.push(payload);

            try { localStorage.setItem('gn_hero_slides', JSON.stringify(local)); } catch(e) {}
            await this._saveCloudSyncState({ hero_slides: local });
            return payload;
        },

        async deleteHeroSlide(id) {
            let local = [];
            try {
                const raw = localStorage.getItem('gn_hero_slides');
                if (raw) local = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(local)) local = defaultHeroSlides;

            local = local.filter(s => String(s.id) !== String(id));
            try { localStorage.setItem('gn_hero_slides', JSON.stringify(local)); } catch(e) {}
            await this._saveCloudSyncState({ hero_slides: local });
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
                const channel = supabase
                    .channel('gn-universal-realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_orders' }, payload => {
                        const rec = payload.new || payload.old;
                        if (rec && rec.customer_name === '__GN_STORE_SYNC__') {
                            // Re-fetch master sync state and dispatch universal events
                            this._getCloudSyncState(true).then(freshState => {
                                if (freshState) dispatchUniversalSyncEvents(freshState);
                            });
                        } else {
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

    // Auto trigger initial products check & load event
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                await window.SupabaseEngine.getProducts();
                await window.SupabaseEngine.getCategories();
                await window.SupabaseEngine.getReviews();
                await window.SupabaseEngine.getHeroSlides();
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
