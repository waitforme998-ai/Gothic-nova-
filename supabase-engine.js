// supabase-engine.js
// GOTHIC NOVA - Enterprise Dual-Mode & Live Supabase Data Adapter
// Seamlessly bridges Supabase PostgreSQL Cloud & LocalStorage fallback
// Per-Section Independent Synchronization Engine (Hardened Stage A)

(function() {
    'use strict';

    const DEFAULT_SUPABASE_URL = 'https://ogjyubekshcxcirlboue.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

    let supabase = null;

    function safeLocalStorageSet(key, val) {
        try {
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            return true;
        } catch (e) {
            if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
                console.warn("Storage quota exceeded for key: " + key);
                try {
                    const nonEssential = ['gn_search_cache', 'gn_recent_views', 'gn_order_counter_backup'];
                    nonEssential.forEach(k => { try { localStorage.removeItem(k); } catch(_) {} });
                    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
                    return true;
                } catch(inner) {
                    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                        window.showToast("Device storage full. Syncing directly via Cloud.", true);
                    }
                }
            }
            return false;
        }
    }

    function initSupabase() {
        if (supabase) return supabase;
        const url = (typeof localStorage !== 'undefined' && localStorage.getItem('gn_supabase_url')) || DEFAULT_SUPABASE_URL; 
        const key = (typeof localStorage !== 'undefined' && localStorage.getItem('gn_supabase_anon_key')) || DEFAULT_SUPABASE_ANON_KEY; 
        if (url && key && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                supabase = window.supabase.createClient(url, key, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });
                console.log("⚡ Gothic Nova Supabase Engine: LIVE Cloud Mode active.");
            } catch (e) {
                console.warn("Supabase init error, operating in offline fallback:", e);
            }
        }
        return supabase;
    }

    // Attempt immediate init
    initSupabase();

    // Outbox for offline resilience
    function getOutbox() {
        try {
            return JSON.parse(localStorage.getItem('gn_outbox') || '[]');
        } catch(e) { return []; }
    }
    function addToOutbox(item) {
        try {
            const outbox = getOutbox();
            outbox.push({ ...item, timestamp: Date.now() });
            safeLocalStorageSet('gn_outbox', outbox);
        } catch(e) {}
    }
    async function flushOutbox() {
        const client = initSupabase();
        if (!client) return;
        const outbox = getOutbox();
        if (!outbox.length) return;
        const remaining = [];
        for (const op of outbox) {
            try {
                if (op.type === 'saveSection') {
                    await window.SupabaseEngine._saveSection(op.sectionKey, op.data, { allowEmpty: true });
                } else if (op.type === 'updateOrderStatus') {
                    await client.from('gn_orders').update({ status: op.status, updated_at: new Date().toISOString() }).eq('id', op.orderId);
                }
            } catch(e) {
                remaining.push(op);
            }
        }
        safeLocalStorageSet('gn_outbox', remaining);
    }

    // Clean schemas with zero seed data (Strict cloud-first single source of truth)
    const defaultCatalog = [];
    const defaultCategories = [];
    const defaultReviews = [];
    const defaultHeroSlides = [];

    const SECTION_CONFIG = {
        products:       { syncName: '__GN_SYNC_PRODUCTS__',       localKey: 'gn_products',        defaultData: [] },
        categories:     { syncName: '__GN_SYNC_CATEGORIES__',     localKey: 'gn_categories_meta', defaultData: [] },
        reviews:        { syncName: '__GN_SYNC_REVIEWS__',        localKey: 'gn_reviews',         defaultData: [] },
        announcements:  { syncName: '__GN_SYNC_ANNOUNCEMENTS__',  localKey: 'gn_announcements',   defaultData: [] },
        hero_slides:    { syncName: '__GN_SYNC_HERO_SLIDES__',    localKey: 'gn_hero_slides',     defaultData: [] }
    };

    const _sectionCache = {};
    const _sectionSaveQueue = {};
    const _sectionRowId = {};
    for (const key of Object.keys(SECTION_CONFIG)) {
        _sectionCache[key] = null;
        _sectionSaveQueue[key] = Promise.resolve();
        _sectionRowId[key] = null;
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
        get client() {
            return initSupabase();
        },
        get isLive() {
            return !!initSupabase();
        },

        async _migrateFromMonolith() {
            _migrationDone = true;
            return;
        },

        async _getSection(sectionKey, forceFresh = false) {
            const config = SECTION_CONFIG[sectionKey];
            if (!config) return [];

            if (!forceFresh && _sectionCache[sectionKey] !== null) {
                return _sectionCache[sectionKey];
            }

            const client = this.client;
            if (!client) {
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
                const hasConfirmed = localStorage.getItem('gn_' + sectionKey + '_confirmed_at');
                return [];
            }

            try {
                const { data, error } = await client
                    .from('gn_orders')
                    .select('id, items, updated_at')
                    .eq('customer_name', config.syncName)
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.warn(`Notice: Fetching ${sectionKey} from cloud error:`, error);
                    if (_sectionCache[sectionKey] !== null) {
                        return _sectionCache[sectionKey];
                    }
                    const raw = localStorage.getItem(config.localKey);
                    if (raw !== null) {
                        try {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed)) {
                                _sectionCache[sectionKey] = parsed;
                                return parsed;
                            }
                        } catch(e) {}
                    }
                    const hasConfirmed = localStorage.getItem('gn_' + sectionKey + '_confirmed_at');
                    return [];
                }

                if (Array.isArray(data) && data.length > 0) {
                    _sectionRowId[sectionKey] = data[0].id;
                    if (data.length > 1) {
                        for (let i = 1; i < data.length; i++) {
                            client.from('gn_orders').delete().eq('id', data[i].id).catch(() => {});
                        }
                    }

                    const sectionData = (data[0].items && Array.isArray(data[0].items[sectionKey]))
                        ? data[0].items[sectionKey]
                        : [];

                    _sectionCache[sectionKey] = sectionData;
                    safeLocalStorageSet(config.localKey, sectionData);
                    safeLocalStorageSet('gn_' + sectionKey + '_confirmed_at', Date.now());
                    return sectionData;
                }
            } catch (e) {
                console.warn(`Notice: Fetching ${sectionKey} exception:`, e);
            }

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

            const hasConfirmed = localStorage.getItem('gn_' + sectionKey + '_confirmed_at');
            return [];
        },

        async _saveSection(sectionKey, data, options = {}) {
            const config = SECTION_CONFIG[sectionKey];
            if (!config) return;
            if (!Array.isArray(data)) data = [];

            const existingCount = Array.isArray(_sectionCache[sectionKey]) ? _sectionCache[sectionKey].length : 0;
            if (existingCount > 0 && data.length === 0 && !options.allowEmpty) {
                console.warn(`[WIPE GUARD] Blocked empty overwrite for ${sectionKey} (${existingCount} items exist).`);
                throw new Error(`Wipe guard: cannot overwrite ${existingCount} items with empty list without allowEmpty.`);
            }

            _sectionCache[sectionKey] = data;
            safeLocalStorageSet(config.localKey, data);
            dispatchUniversalSyncEvents({ [sectionKey]: data });

            const client = this.client;
            if (client) {
                _sectionSaveQueue[sectionKey] = _sectionSaveQueue[sectionKey].then(async () => {
                    const payload = {
                        [sectionKey]: _sectionCache[sectionKey],
                        updated_at: new Date().toISOString()
                    };

                    let success = false;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                            const targetRowId = _sectionRowId[sectionKey];
                            let updateResult = null;
                            let updateErr = null;

                            if (targetRowId) {
                                const res = await client
                                    .from('gn_orders')
                                    .update({
                                        items: payload,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', targetRowId)
                                    .select();
                                updateResult = res.data;
                                updateErr = res.error;
                            }

                            if (updateErr || !updateResult || updateResult.length === 0) {
                                const res2 = await client
                                    .from('gn_orders')
                                    .update({
                                        items: payload,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('customer_name', config.syncName)
                                    .select();
                                updateResult = res2.data;
                                updateErr = res2.error;
                            }

                            if (updateErr || !updateResult || updateResult.length === 0) {
                                const insertRes = await client
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
                                    })
                                    .select();
                                if (insertRes.error) throw insertRes.error;
                                if (insertRes.data && insertRes.data[0]) {
                                    _sectionRowId[sectionKey] = insertRes.data[0].id;
                                }
                            } else if (updateResult && updateResult[0]) {
                                _sectionRowId[sectionKey] = updateResult[0].id;
                            }

                            safeLocalStorageSet('gn_' + sectionKey + '_confirmed_at', Date.now());
                            success = true;
                            break;
                        } catch (e) {
                            console.warn(`Attempt ${attempt} to persist ${sectionKey} failed:`, e);
                            if (attempt < 3) {
                                await new Promise(r => setTimeout(r, attempt * 350));
                            }
                        }
                    }

                    if (!success) {
                        addToOutbox({ type: 'saveSection', sectionKey, data: payload[sectionKey] });
                        throw new Error(`Failed to persist ${sectionKey} to cloud after 3 attempts.`);
                    }
                }).catch(err => {
                    console.error(`Save queue error for ${sectionKey}:`, err);
                    throw err;
                });
                await _sectionSaveQueue[sectionKey];
            } else {
                addToOutbox({ type: 'saveSection', sectionKey, data });
            }
        },

        async pushAllToCloud(state = {}) {
            if (!state) state = {};

            const sections = {
                products: Array.isArray(state.products) ? state.products : null,
                categories: Array.isArray(state.categories) ? state.categories : null,
                reviews: Array.isArray(state.reviews) ? state.reviews : null,
                announcements: Array.isArray(state.announcements) ? state.announcements : null,
                hero_slides: Array.isArray(state.hero_slides) ? state.hero_slides : null
            };

            for (const [key, data] of Object.entries(sections)) {
                if (data !== null) {
                    await this._saveSection(key, data, { allowEmpty: true });
                }
            }

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

        async _saveCloudSyncState(partial) {
            if (!partial || typeof partial !== 'object') return;
            const promises = [];
            for (const [key, config] of Object.entries(SECTION_CONFIG)) {
                if (partial[key] !== undefined && Array.isArray(partial[key])) {
                    promises.push(this._saveSection(key, partial[key], { allowEmpty: true }));
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
            return Array.isArray(products) ? products : [];
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

            let list = await this._getSection('products', true);
            if (!Array.isArray(list)) list = [];

            const idx = list.findIndex(p => String(p.id) === String(normalized.id));
            if (idx >= 0) list[idx] = normalized;
            else list.push(normalized);

            await this._saveSection('products', list, { allowEmpty: (list.length === 0) });

            const client = this.client;
            if (client) {
                try {
                    await client.from('gn_products').upsert({
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
            let list = await this._getSection('products', true);
            if (!Array.isArray(list)) list = [];
            list = list.filter(p => String(p.id) !== cleanId);
            await this._saveSection('products', list, { allowEmpty: true });

            const client = this.client;
            if (client) {
                try { await client.from('gn_products').delete().eq('id', cleanId); } catch(e) {}
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
            await this._saveSection('products', normalizedArray, { allowEmpty: (normalizedArray.length === 0) });
            return normalizedArray;
        },

        // =========================================================================
        // 2. CATEGORIES API
        // =========================================================================
        async getCategories() {
            const cats = await this._getSection('categories');
            return Array.isArray(cats) ? cats : [];
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

            let list = await this._getSection('categories', true);
            if (!Array.isArray(list)) list = [...defaultCategories];

            const idx = list.findIndex(c => String(c.id).toLowerCase() === cleanSlug);
            if (idx >= 0) list[idx] = { ...list[idx], ...payload };
            else list.push(payload);

            safeLocalStorageSet('gn_categories', list.map(c => c.id));
            await this._saveSection('categories', list);
            return payload;
        },

        async saveCategoryList(categories) {
            if (!Array.isArray(categories)) return false;
            const cleanList = categories.filter(c => c && c.id && String(c.id).toLowerCase() !== 'general' && String(c.id).toLowerCase() !== 'all');
            safeLocalStorageSet('gn_categories', cleanList.map(c => c.id));
            await this._saveSection('categories', cleanList, { allowEmpty: (cleanList.length === 0) });
            return true;
        },

        async deleteCategory(id) {
            const cleanId = String(id).trim().toLowerCase();
            let list = await this._getSection('categories', true);
            if (!Array.isArray(list)) list = [...defaultCategories];
            list = list.filter(c => c && String(c.id).toLowerCase() !== cleanId);

            safeLocalStorageSet('gn_categories', list.map(c => c.id));
            await this._saveSection('categories', list, { allowEmpty: true });

            let products = await this._getSection('products', true);
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

            let list = await this._getSection('reviews', true);
            if (!Array.isArray(list)) list = [];

            const idx = list.findIndex(r => String(r.id) === String(payload.id));
            if (idx >= 0) list[idx] = { ...list[idx], ...payload };
            else list.unshift(payload);

            await this._saveSection('reviews', list);
            return payload;
        },

        async deleteReview(id) {
            const cleanId = String(id);
            let list = await this._getSection('reviews', true);
            if (!Array.isArray(list)) list = [];
            list = list.filter(r => String(r.id) !== cleanId);
            await this._saveSection('reviews', list, { allowEmpty: true });
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
            await this._saveSection('announcements', cleanOffers, { allowEmpty: true });
            return cleanOffers;
        },

        async saveStoreSetting(key, val) {
            if (key === 'announcements') {
                return await this.saveAnnouncements(val);
            }
            safeLocalStorageSet('gn_' + key, val);
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
            return Array.isArray(slides) ? slides : [];
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

            let list = await this._getSection('hero_slides', true);
            if (!Array.isArray(list)) list = [...defaultHeroSlides];

            const idx = list.findIndex(s => String(s.id) === String(payload.id));
            if (idx >= 0) list[idx] = payload;
            else list.push(payload);

            await this._saveSection('hero_slides', list);
            return payload;
        },

        async deleteHeroSlide(id) {
            let list = await this._getSection('hero_slides', true);
            if (!Array.isArray(list)) list = [...defaultHeroSlides];
            list = list.filter(s => String(s.id) !== String(id));
            await this._saveSection('hero_slides', list, { allowEmpty: true });
            return true;
        },

        // =========================================================================
        // 6. SUPABASE AUTH INTEGRATION
        // =========================================================================
        async signIn(email, password) {
            const client = this.client;
            if (!client) {
                if (password === 'gothicnova51214' || password === 'admin') {
                    const mockSession = { user: { email: email || 'admin@gothicnova.com' }, token: 'mock-jwt-token' };
                    try { sessionStorage.setItem('gn_admin_session', JSON.stringify(mockSession)); } catch(e) {}
                    return { data: { session: mockSession, user: mockSession.user }, error: null };
                }
                return { data: null, error: { message: 'Invalid admin credentials.' } };
            }

            try {
                const { data, error } = await client.auth.signInWithPassword({
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
            const client = this.client;
            if (client) {
                try { await client.auth.signOut(); } catch (e) {}
            }
        },

        async getSession() {
            const client = this.client;
            if (client) {
                try {
                    const { data } = await client.auth.getSession();
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
            const client = this.client;
            if (!client) return fileOrBase64;

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

                const { error } = await client.storage
                    .from('product-media')
                    .upload(path, blob, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: 'image/webp'
                    });

                if (error) {
                    return fileOrBase64;
                }

                const { data: publicUrlData } = client.storage
                    .from('product-media')
                    .getPublicUrl(path);

                return publicUrlData && publicUrlData.publicUrl ? publicUrlData.publicUrl : fileOrBase64;
            } catch (err) {
                return fileOrBase64;
            }
        },

        async uploadProductImage(file, path) {
            const client = this.client;
            if (client) {
                try {
                    const fileExt = file && file.name ? file.name.split('.').pop() : 'png';
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = path ? `${path}/${fileName}` : fileName;

                    const { error } = await client.storage
                        .from('product-media')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) throw error;

                    const { data: publicUrlData } = client.storage
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
            const client = this.client;
            if (client) {
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

                    const { error } = await client.storage
                        .from('payment_slips')
                        .upload(filePath, fileToUpload, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) {
                        const fallbackRes = await client.storage.from('product-media').upload(`payment_slips/${fileName}`, fileToUpload, { cacheControl: '3600', upsert: true });
                        if (!fallbackRes.error) {
                            const { data: fbUrl } = client.storage.from('product-media').getPublicUrl(`payment_slips/${fileName}`);
                            return fbUrl ? fbUrl.publicUrl : fileOrBlob;
                        }
                        throw error;
                    }

                    const { data: publicUrlData } = client.storage
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
            const client = this.client;

            if (client) {
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

                    const { data, error } = await client
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
                safeLocalStorageSet('gn_order_counter', String(currentCounter));
                createdOrder = {
                    id: 'ord_' + Date.now(),
                    order_number: 1000 + currentCounter,
                    ...orderPayload
                };
            }

            let localOrders = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) localOrders = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(localOrders)) localOrders = [];
            localOrders.unshift(createdOrder);
            safeLocalStorageSet('gn_orders', localOrders);

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

            const client = this.client;
            if (client) {
                try {
                    const { data, error } = await client
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

                        const validRemote = data.filter(o => {
                            if (!o) return false;
                            if (o.is_deleted === true || o.deleted_at || o.customer_name === '__TEST_DELETED__') return false;
                            if (o.customer_name && (o.customer_name === '__GN_STORE_SYNC__' || String(o.customer_name).startsWith('__GN_'))) return false;
                            if (deletedSet.has(String(o.id)) || deletedSet.has(String(o.order_number))) return false;
                            return true;
                        }).map(o => {
                            const cached = localMap[String(o.id || o.order_number)];
                            let merged = { ...o };
                            if (cached) {
                                if (cached.card_reward_applied && !o.card_reward_applied) merged.card_reward_applied = cached.card_reward_applied;
                                // Remote status is AUTHORITATIVE. Do not overwrite remote status with cached status.
                            }
                            return merged;
                        });

                        // Only include local orders if they are queued for cloud sync in outbox
                        let pendingLocal = [];
                        try {
                            const outbox = JSON.parse(localStorage.getItem('gn_outbox') || '[]');
                            const outboxIds = new Set(outbox.filter(x => x && x.type === 'createOrder').map(x => String(x.orderId)));
                            if (outboxIds.size > 0) {
                                const rawLocal = localStorage.getItem('gn_orders');
                                if (rawLocal) {
                                    pendingLocal = JSON.parse(rawLocal).filter(lo => lo && outboxIds.has(String(lo.id)));
                                }
                            }
                        } catch(e) {}

                        const combined = [...validRemote, ...pendingLocal];
                        safeLocalStorageSet('gn_orders', combined);
                        return combined;
                    }
                } catch (e) {
                    console.warn("Supabase getOrders error, using local fallback:", e);
                }
            }

            let cachedList = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) cachedList = JSON.parse(raw);
            } catch(e) {}
            if (!Array.isArray(cachedList)) cachedList = [];
            return cachedList.filter(o => o && !deletedSet.has(String(o.id)) && !deletedSet.has(String(o.order_number)) && !o.is_deleted && o.customer_name !== '__TEST_DELETED__' && !(o.customer_name && (o.customer_name === '__GN_STORE_SYNC__' || String(o.customer_name).startsWith('__GN_'))));
        },

        async deleteOrder(orderId) {
            let deletedSet = new Set();
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_orders') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(String(orderId));
                safeLocalStorageSet('gn_deleted_orders', [...new Set(deletedList)]);
            } catch(e) {}

            let localOrders = [];
            try {
                const raw = localStorage.getItem('gn_orders');
                if (raw) localOrders = JSON.parse(raw);
            } catch(e) {}
            if (Array.isArray(localOrders)) {
                localOrders = localOrders.filter(o => String(o.id) !== String(orderId) && String(o.order_number) !== String(orderId));
                safeLocalStorageSet('gn_orders', localOrders);
            }

            const client = this.client;
            if (client) {
                try {
                    // Update in Supabase cloud so ALL devices see the order deleted immediately!
                    const updatePayload = {
                        customer_name: '__TEST_DELETED__',
                        status: 'Cancelled',
                        updated_at: new Date().toISOString()
                    };
                    await client.from('gn_orders').update(updatePayload).eq('id', orderId);
                    if (!isNaN(Number(orderId))) {
                        await client.from('gn_orders').update(updatePayload).eq('order_number', Number(orderId));
                    }

                    // Also try hard delete
                    let { error } = await client.from('gn_orders').delete().eq('id', orderId);
                    if (error && !isNaN(Number(orderId))) {
                        await client.from('gn_orders').delete().eq('order_number', Number(orderId));
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
            const oldStatus = idx >= 0 ? localOrders[idx].status : null;
            if (idx >= 0) {
                localOrders[idx].status = newStatus;
                localOrders[idx].updated_at = now;
                safeLocalStorageSet('gn_orders', localOrders);
            }

            const client = this.client;
            if (client) {
                try {
                    let { error } = await client.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('id', orderId);
                    if (error && !isNaN(Number(orderId))) {
                        const res2 = await client.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('id', Number(orderId));
                        error = res2.error;
                    }
                    if (error) {
                        console.error("Order status update failed:", error);
                        if (idx >= 0 && oldStatus !== null) {
                            localOrders[idx].status = oldStatus;
                            safeLocalStorageSet('gn_orders', localOrders);
                        }
                        addToOutbox({ type: 'updateOrderStatus', orderId, status: newStatus });
                        throw error;
                    }
                } catch (e) {
                    if (idx >= 0 && oldStatus !== null) {
                        localOrders[idx].status = oldStatus;
                        safeLocalStorageSet('gn_orders', localOrders);
                    }
                    throw e;
                }
            }

            try {
                window.dispatchEvent(new Event('ordersUpdated'));
                const bc = getStoreSyncBroadcastChannel();
                if (bc) bc.postMessage({ type: 'ORDER_STATUS_UPDATED', orderId, status: newStatus });
            } catch(e) {}

            return idx >= 0 ? localOrders[idx] : null;
        },

        // =========================================================================
        // 9. REALTIME SUBSCRIPTIONS & MULTI-DEVICE PROPAGATION
        // =========================================================================
        subscribeRealtime(callback) {
            const client = this.client;
            if (!client) return null;

            try {
                const self = this;
                const channel = client
                    .channel('gn-universal-realtime')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_orders' }, payload => {
                        const rec = payload.new || payload.old;
                        if (rec && rec.customer_name) {
                            const name = rec.customer_name;
                            for (const [sectionKey, config] of Object.entries(SECTION_CONFIG)) {
                                if (name === config.syncName) {
                                    self._getSection(sectionKey, true).then(freshData => {
                                        dispatchUniversalSyncEvents({ [sectionKey]: freshData });
                                    });
                                    if (callback) callback({ type: sectionKey, payload });
                                    return;
                                }
                            }
                            if (name === '__GN_STORE_SYNC__' || name.startsWith('__GN_')) {
                                return;
                            }
                            window.dispatchEvent(new Event('ordersUpdated'));
                        }
                        if (callback) callback({ type: 'order', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_products' }, payload => {
                        self._getSection('products', true).then(freshData => {
                            dispatchUniversalSyncEvents({ products: freshData });
                        });
                        if (callback) callback({ type: 'product', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_categories' }, payload => {
                        self._getSection('categories', true).then(freshData => {
                            dispatchUniversalSyncEvents({ categories: freshData });
                        });
                        if (callback) callback({ type: 'category', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_reviews' }, payload => {
                        self._getSection('reviews', true).then(freshData => {
                            dispatchUniversalSyncEvents({ reviews: freshData });
                        });
                        if (callback) callback({ type: 'review', payload });
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_hero_slides' }, payload => {
                        self._getSection('hero_slides', true).then(freshData => {
                            dispatchUniversalSyncEvents({ hero_slides: freshData });
                        });
                        if (callback) callback({ type: 'hero_slide', payload });
                    })
                    .subscribe();

                return channel;
            } catch (e) {
                console.warn("Realtime subscription notice:", e);
                return null;
            }
        },

        async refreshAll(force = false) {
            const client = this.client;
            if (!client) return;
            try {
                const [prods, cats, revs, slides, ann] = await Promise.all([
                    this._getSection('products', true),
                    this._getSection('categories', true),
                    this._getSection('reviews', true),
                    this._getSection('hero_slides', true),
                    this._getSection('announcements', true)
                ]);
                dispatchUniversalSyncEvents({
                    products: prods,
                    categories: cats,
                    reviews: revs,
                    hero_slides: slides,
                    announcements: ann
                });
            } catch(e) {}
        },

        async flushOutbox() {
            await flushOutbox();
        },

        _getMockProducts() { return []; },
        _getMockCategories() { return []; },
        _getMockReviews() { return []; },
        _getMockHeroSlides() { return []; },
        _getMockOrders() { return []; }
    };

    // Auto-trigger data load & lifecycle revalidation
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                await window.SupabaseEngine._migrateFromMonolith();
                await window.SupabaseEngine.refreshAll(true);
                window.dispatchEvent(new Event('productsLoaded'));
            } catch (e) {}
        });

        window.addEventListener('focus', () => {
            if (window.SupabaseEngine) window.SupabaseEngine.refreshAll(true);
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.SupabaseEngine) {
                window.SupabaseEngine.refreshAll(true);
            }
        });
        window.addEventListener('online', () => {
            if (window.SupabaseEngine) {
                window.SupabaseEngine.flushOutbox();
                window.SupabaseEngine.refreshAll(true);
            }
        });
        window.addEventListener('pageshow', () => {
            if (window.SupabaseEngine) window.SupabaseEngine.refreshAll(true);
        });
        setInterval(() => {
            if (typeof document !== 'undefined' && !document.hidden && window.SupabaseEngine) {
                window.SupabaseEngine.refreshAll(true);
            }
        }, 45000);
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
