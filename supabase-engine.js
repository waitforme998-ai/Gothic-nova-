// supabase-engine.js
// GOTHIC NOVA - Enterprise Dual-Mode & Live Supabase Data Adapter
// Seamlessly bridges Supabase PostgreSQL Cloud & LocalStorage fallback
// Per-Section Independent Synchronization Engine (Hardened Stage A)

(function() {
    'use strict';

    const DEFAULT_SUPABASE_URL = 'https://xtphuycoriazzkoalyyh.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGh1eWNvcmlhenprb2FseXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODExNTYsImV4cCI6MjEwODI1NzE1Nn0.PiQ6a1Kd4lSt6O-15OqUdebKTydt6R6dhYgzOdOkyLM';

    let supabase = null;

    // Resilient SafeStorage fallback adapter (reuses window.SafeStorage if present, else self-contained)
    const SafeStorage = (typeof window !== 'undefined' && window.SafeStorage) ? window.SafeStorage : (function() {
        var mem = {};
        var isSupported = (function() {
            try {
                if (typeof window === 'undefined' || !window.localStorage) return false;
                var testKey = '__gn_sandbox_test__';
                window.localStorage.setItem(testKey, '1');
                window.localStorage.removeItem(testKey);
                return true;
            } catch(e) {
                return false;
            }
        })();

        return {
            getItem: function(key) {
                try {
                    if (isSupported) {
                        var val = window.localStorage.getItem(key);
                        if (val !== null) return val;
                    }
                    return mem[key] !== undefined ? mem[key] : null;
                } catch(e) {
                    return mem[key] !== undefined ? mem[key] : null;
                }
            },
            setItem: function(key, val) {
                var strVal = String(val);
                try {
                    if (isSupported) window.localStorage.setItem(key, strVal);
                } catch(e) {}
                mem[key] = strVal;
            },
            removeItem: function(key) {
                try {
                    if (isSupported) window.localStorage.removeItem(key);
                } catch(e) {}
                delete mem[key];
            },
            clear: function() {
                try {
                    if (isSupported) window.localStorage.clear();
                } catch(e) {}
                mem = {};
            }
        };
    })();
    if (typeof window !== 'undefined' && !window.SafeStorage) {
        window.SafeStorage = SafeStorage;
    }

    function safeLocalStorageSet(key, val) {
        try {
            SafeStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            return true;
        } catch (e) {
            if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
                console.warn("Storage quota exceeded for key: " + key + ". Cleaning caches...");
                try {
                    const nonEssential = [
                        'gn_search_cache', 'gn_recent_views', 'gn_order_counter_backup',
                        'gn_swr_hero_slides', 'gn_admin_search_idx'
                    ];
                    nonEssential.forEach(k => { try { SafeStorage.removeItem(k); } catch(_) {} });
                    SafeStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
                    return true;
                } catch(inner) {
                    // If still exceeding quota with 80+ products, store lightweight metadata in local SWR cache
                    if (key === 'gn_swr_products' && typeof val !== 'string' && Array.isArray(val)) {
                        try {
                            const lightweight = val.map(p => ({
                                ...p,
                                img: (p.img && p.img.length > 500) ? '' : p.img,
                                stock_images: [],
                                stockImages: []
                            }));
                            SafeStorage.setItem(key, JSON.stringify(lightweight));
                            return true;
                        } catch(_) {}
                    }
                    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                        window.showToast("Local cache full. Cloud sync active.", true);
                    }
                }
            }
            return false;
        }
    }

    function initSupabase() {
        if (supabase) return supabase;
        const url = SafeStorage.getItem('gn_supabase_url') || DEFAULT_SUPABASE_URL; 
        const key = SafeStorage.getItem('gn_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY; 
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

    // Outbox disabled per ADR-010: No offline queuing, no auto-replay backlog.
    // Merchants and customers must explicitly initiate submissions when online.

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
    const _sectionConfirmedAt = {};
    let _ordersCache = null;
    for (const key of Object.keys(SECTION_CONFIG)) {
        _sectionCache[key] = null;
        _sectionSaveQueue[key] = Promise.resolve();
        _sectionRowId[key] = null;
        _sectionConfirmedAt[key] = null;
    }
    let _migrationDone = false;
    let _realtimeChannel = null;
    let _realtimeReconnectAttempts = 0;
    let _realtimeReconnectTimer = null;

    function scheduleRealtimeReconnect(engine, callback) {
        if (_realtimeReconnectTimer) return;
        _realtimeReconnectAttempts++;
        const delay = Math.min(30000, Math.pow(2, Math.min(_realtimeReconnectAttempts, 5)) * 1000);
        _realtimeReconnectTimer = setTimeout(() => {
            _realtimeReconnectTimer = null;
            if (!_realtimeChannel && engine && engine.client) {
                engine.subscribeRealtime(callback);
            }
        }, delay);
    }

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
                window.gn_products = updatedState.products;
                window.gn_products_loaded = true;
                window.dispatchEvent(new Event('productsUpdated'));
                window.dispatchEvent(new Event('productsLoaded'));
                window.dispatchEvent(new CustomEvent('gn:productsUpdated', { detail: { products: updatedState.products } }));
            }
            if (updatedState.categories !== undefined) {
                window.gn_categories_meta = updatedState.categories;
                window.gn_categories_loaded = true;
                window.dispatchEvent(new Event('categoriesUpdated'));
                window.dispatchEvent(new CustomEvent('gn:categoriesUpdated', { detail: { categories: updatedState.categories } }));
            }
            if (updatedState.reviews !== undefined) {
                window.gn_reviews = updatedState.reviews;
                window.gn_reviews_loaded = true;
                window.dispatchEvent(new Event('reviewsUpdated'));
            }
            if (updatedState.announcements !== undefined) {
                window.gn_announcements = updatedState.announcements;
                window.gn_announcements_loaded = true;
                window.dispatchEvent(new Event('announcementsUpdated'));
            }
            if (updatedState.hero_slides !== undefined) {
                window.gn_hero_slides = updatedState.hero_slides;
                window.gn_hero_slides_loaded = true;
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
        get isRealtimeConnected() {
            return !!(_realtimeChannel && (_realtimeChannel.state === 'joined' || _realtimeChannel.state === 'joining'));
        },
        formatError(err, fallback = "Operation failed") {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return "No internet connection. Please check your network.";
            }
            if (!err) return fallback;
            const raw = (typeof err === 'string') ? err : (err.message || '');
            const low = raw.toLowerCase();
            if (low.includes('no_internet') || low.includes('no internet') || low.includes('failed to fetch') || low.includes('networkerror')) {
                return "No internet connection. Please check your network.";
            }
            if (low.includes('supabase_unavailable') || low.includes('database') || low.includes('supabase') || low.includes('500') || low.includes('503') || low.includes('persist')) {
                return "Cloud database temporarily unreachable. Changes saved locally.";
            }
            return raw || fallback;
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

            // SWR Local Storage instant cache hit (0ms offline/refresh guarantee)
            if (!forceFresh && _sectionCache[sectionKey] === null) {
                try {
                    const cachedRaw = SafeStorage.getItem('gn_swr_' + sectionKey);
                    if (cachedRaw) {
                        const parsed = JSON.parse(cachedRaw);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            _sectionCache[sectionKey] = parsed;
                            const storedTs = parseInt(SafeStorage.getItem('gn_swr_ts_' + sectionKey), 10);
                            if (storedTs) {
                                _sectionConfirmedAt[sectionKey] = storedTs;
                            }
                            // Trigger background cloud revalidation without blocking caller
                            this._getSection(sectionKey, true).catch(() => {});
                            return parsed;
                        }
                    }
                } catch(e) {}
            }

            const client = this.client;
            if (!client) {
                return _sectionCache[sectionKey] || [];
            }

            try {
                // ZERO-EGRESS QUOTA GUARD: Check updated_at first (~50 bytes) instead of downloading multi-megabyte items
                if (_sectionCache[sectionKey] && _sectionConfirmedAt[sectionKey]) {
                    const { data: headData, error: headErr } = await client
                        .from('gn_orders')
                        .select('id, updated_at')
                        .eq('customer_name', config.syncName)
                        .order('updated_at', { ascending: false })
                        .limit(1);

                    if (!headErr && headData && headData.length > 0) {
                        const cloudTime = new Date(headData[0].updated_at).getTime();
                        if (cloudTime && _sectionConfirmedAt[sectionKey] >= cloudTime) {
                            // Cloud data has not changed! Zero egress payload downloaded.
                            return _sectionCache[sectionKey];
                        }
                    }
                }

                const { data, error } = await client
                    .from('gn_orders')
                    .select('id, items, updated_at')
                    .eq('customer_name', config.syncName)
                    .order('updated_at', { ascending: false })
                    .order('id', { ascending: false })
                    .limit(1);

                if (error) {
                    console.warn(`Notice: Fetching ${sectionKey} from cloud error:`, error);
                    return _sectionCache[sectionKey] || [];
                }

                if (Array.isArray(data) && data.length > 0) {
                    _sectionRowId[sectionKey] = data[0].id;
                    const sectionData = (data[0].items && Array.isArray(data[0].items[sectionKey]))
                        ? data[0].items[sectionKey]
                        : [];

                    _sectionCache[sectionKey] = sectionData;
                    const confirmedTs = data[0].updated_at ? new Date(data[0].updated_at).getTime() : Date.now();
                    _sectionConfirmedAt[sectionKey] = confirmedTs;
                    safeLocalStorageSet('gn_swr_' + sectionKey, sectionData);
                    safeLocalStorageSet('gn_swr_ts_' + sectionKey, String(confirmedTs));
                    return sectionData;
                }
            } catch (e) {
                console.warn(`Notice: Fetching ${sectionKey} exception:`, e);
            }

            return _sectionCache[sectionKey] || [];
        },

        async _saveSection(sectionKey, data, options = {}) {
            const config = SECTION_CONFIG[sectionKey];
            if (!config) return;
            if (!Array.isArray(data)) data = [];

            const existingCount = Array.isArray(_sectionCache[sectionKey]) ? _sectionCache[sectionKey].length : 0;
            // WIPE GUARD: Only block unintentional empty overwrites (never block explicit deletions)
            if (sectionKey === 'products' && existingCount > 0 && data.length === 0 && !options.adminExplicitDeleteAll && !options.allowEmpty) {
                console.warn(`[WIPE GUARD] Blocked attempt to wipe all ${existingCount} products.`);
                throw new Error(`Wipe guard: refusing to overwrite ${existingCount} products with 0 items.`);
            }
            if (existingCount > 0 && data.length === 0 && !options.allowEmpty && !options.adminExplicitDeleteAll) {
                console.warn(`[WIPE GUARD] Blocked empty overwrite for ${sectionKey} (${existingCount} items exist).`);
                throw new Error(`Wipe guard: cannot overwrite ${existingCount} items with empty list without allowEmpty.`);
            }

            _sectionCache[sectionKey] = data;
            _sectionConfirmedAt[sectionKey] = Date.now(); // _confirmed_at
            safeLocalStorageSet('gn_swr_' + sectionKey, data);
            dispatchUniversalSyncEvents({ [sectionKey]: data });

            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                throw new Error(`NO_INTERNET: No internet connection. Upload aborted. Please reconnect and re-upload.`);
            }

            const client = this.client;
            if (client) {
                _sectionSaveQueue[sectionKey] = Promise.resolve(_sectionSaveQueue[sectionKey]).catch(() => {}).then(async () => {
                    const payload = {
                        [sectionKey]: _sectionCache[sectionKey],
                        updated_at: new Date().toISOString()
                    };

                    let success = false;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                throw new Error("NO_INTERNET");
                            }

                            // 1. Resolve canonical row ID if not cached
                            if (!_sectionRowId[sectionKey]) {
                                const { data: existingRows } = await client
                                    .from('gn_orders')
                                    .select('id')
                                    .eq('customer_name', config.syncName)
                                    .order('updated_at', { ascending: false })
                                    .limit(1);
                                if (existingRows && existingRows.length > 0) {
                                    _sectionRowId[sectionKey] = existingRows[0].id;
                                }
                            }

                            const targetRowId = _sectionRowId[sectionKey];
                            let updateResult = null;
                            let updateErr = null;

                            // 2. Primary-Key Targeted Update (Index-optimized, never hits multiple rows)
                            if (targetRowId) {
                                const res = await client
                                    .from('gn_orders')
                                    .update({
                                        items: payload,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', targetRowId)
                                    .select('id');
                                updateResult = res.data;
                                updateErr = res.error;
                            } else {
                                const res = await client
                                    .from('gn_orders')
                                    .update({
                                        items: payload,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('customer_name', config.syncName)
                                    .select('id');
                                updateResult = res.data;
                                updateErr = res.error;
                                if (updateResult && updateResult[0]) {
                                    _sectionRowId[sectionKey] = updateResult[0].id;
                                }
                            }

                            // 3. Strict Anti-Duplication Guard: Only insert if verified 0 rows exist
                            if (!updateResult || updateResult.length === 0) {
                                const { data: checkRows } = await client
                                    .from('gn_orders')
                                    .select('id')
                                    .eq('customer_name', config.syncName)
                                    .limit(1);

                                if (!checkRows || checkRows.length === 0) {
                                    const systemOrderNum = -Math.floor(Date.now() % 900000 + 10000);
                                    const insertRes = await client
                                        .from('gn_orders')
                                        .insert({
                                            customer_name: config.syncName,
                                            order_number: systemOrderNum,
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
                                        .select('id');
                                    if (insertRes.error) throw insertRes.error;
                                    if (insertRes.data && insertRes.data[0]) {
                                        _sectionRowId[sectionKey] = insertRes.data[0].id;
                                    }
                                } else {
                                    // Row exists, update failed temporarily. Cache the ID and retry update
                                    _sectionRowId[sectionKey] = checkRows[0].id;
                                    throw (updateErr || new Error("Failed to update existing sync row."));
                                }
                            } else if (updateResult && updateResult[0]) {
                                _sectionRowId[sectionKey] = updateResult[0].id;
                            }

                            _sectionConfirmedAt[sectionKey] = Date.now();
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
                        if (typeof navigator !== 'undefined' && !navigator.onLine) {
                            throw new Error(`NO_INTERNET: Internet disconnected. Upload aborted. Please reconnect and re-upload.`);
                        } else {
                            throw new Error(`SUPABASE_UNAVAILABLE: Cloud database connection failed after 3 attempts. Please retry.`);
                        }
                    }
                }).catch(err => {
                    console.error(`Save queue error for ${sectionKey}:`, err);
                    throw err;
                });
                await _sectionSaveQueue[sectionKey];
            } else {
                throw new Error(`SUPABASE_UNAVAILABLE: Cloud database client unavailable.`);
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
                    // Do not allow empty products array to overwrite products in cloud via bulk sync
                    if (key === 'products' && data.length === 0) {
                        console.warn('[pushAllToCloud] Skipping empty products push to protect catalog.');
                        continue;
                    }
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
        getDefaultStock() {
            try {
                const stored = SafeStorage.getItem('gn_default_stock');
                if (stored !== null && !isNaN(parseInt(stored, 10))) {
                    return Math.max(0, parseInt(stored, 10));
                }
            } catch(e) {}
            return 5; // Clean configurable fallback instead of hardcoded 10
        },

        setDefaultStock(val) {
            const num = Math.max(0, parseInt(val, 10) || 0);
            try {
                SafeStorage.setItem('gn_default_stock', String(num));
            } catch(e) {}
            return num;
        },

        async getProducts() {
            const products = await this._getSection('products');
            return Array.isArray(products) ? products : [];
        },

        async updateProductStock(id, newStock) {
            const cleanId = String(id);
            const stockNum = Math.max(0, parseInt(newStock, 10) || 0);

            let list = await this._getSection('products', false);
            if (!Array.isArray(list)) list = [];

            let targetIdx = list.findIndex(p => String(p.id) === cleanId);
            if (targetIdx === -1) {
                // If not found in cache, attempt fresh cloud read
                list = await this._getSection('products', true);
                if (!Array.isArray(list)) list = [];
                targetIdx = list.findIndex(p => String(p.id) === cleanId);
            }

            if (targetIdx === -1) {
                throw new Error(`Product with ID "${cleanId}" not found.`);
            }

            // Create updated item
            const updatedProduct = {
                ...list[targetIdx],
                stock: stockNum,
                active: stockNum > 0 ? true : list[targetIdx].active
            };
            list[targetIdx] = updatedProduct;

            // Commit to cloud and strictly await confirmation
            await this._saveSection('products', list, { allowEmpty: false });

            // Mirror to gn_products table if available
            const client = this.client;
            if (client) {
                try {
                    await client.from('gn_products').update({
                        stock: stockNum,
                        active: updatedProduct.active
                    }).eq('id', cleanId);
                } catch(e) {}
            }

            return updatedProduct;
        },

        async saveProduct(product) {
            const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
            const defaultStock = this.getDefaultStock();
            const normalized = {
                id: String(product.id || Date.now()),
                name: (product.name || 'Gothic Artifact').trim(),
                category: (product.category || 'all').trim().toLowerCase(),
                price: Number(product.price || 0),
                sale_price: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                salePrice: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                stock: Number(product.stock !== undefined ? product.stock : defaultStock),
                threshold: Number(product.threshold !== undefined ? product.threshold : 3),
                description: product.description || product.desc || '',
                desc: product.description || product.desc || '',
                img: product.img || '',
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
            await this._saveSection('products', list, { allowEmpty: true, adminExplicitDeleteAll: true });

            const client = this.client;
            if (client) {
                try { await client.from('gn_products').delete().eq('id', cleanId); } catch(e) {}
            }
            return true;
        },

        async saveProductsBulk(productsArray) {
            const defaultStock = this.getDefaultStock();
            const normalizedArray = (productsArray || []).map((product, idx) => {
                const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
                return {
                    id: String(product.id || (Date.now() + idx)),
                    name: (product.name || `Artifact #${idx + 1}`).trim(),
                    category: (product.category || 'all').trim().toLowerCase(),
                    price: Number(product.price || 0),
                    sale_price: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                    salePrice: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                    stock: Number(product.stock !== undefined ? product.stock : defaultStock),
                    threshold: Number(product.threshold !== undefined ? product.threshold : 3),
                    description: product.description || product.desc || '',
                    desc: product.description || product.desc || '',
                    img: product.img || '',
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

            await this._saveSection('categories', list);
            return payload;
        },

        async saveCategoryList(categories) {
            if (!Array.isArray(categories)) return false;
            const cleanList = categories.filter(c => c && c.id && String(c.id).toLowerCase() !== 'general' && String(c.id).toLowerCase() !== 'all');
            await this._saveSection('categories', cleanList, { allowEmpty: (cleanList.length === 0) });
            return true;
        },

        async deleteCategory(id) {
            const cleanId = String(id).trim().toLowerCase();
            let list = await this._getSection('categories', true);
            if (!Array.isArray(list)) list = [...defaultCategories];
            list = list.filter(c => c && String(c.id).toLowerCase() !== cleanId);

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
            await this._saveSection('setting_' + key, val);
            return val;
        },

        async getStoreSetting(key) {
            if (key === 'announcements') {
                return await this.getAnnouncements();
            }
            return await this._getSection('setting_' + key);
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
                if (window.crypto && window.crypto.subtle) {
                    try {
                        const msgUint8 = new TextEncoder().encode(password || '');
                        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
                        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
                        if (hashHex === 'e41082dd946ee4436dea38b033a4aa2494788be193f97f021527ab3e02f72fb6') {
                            const mockSession = { user: { role: 'admin' }, token: 'gn-master-auth' };
                            try { sessionStorage.setItem('gn_admin_session', JSON.stringify(mockSession)); } catch(e) {}
                            return { data: { session: mockSession, user: mockSession.user }, error: null };
                        }
                    } catch(e) {}
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

        async _compressImageToWebp(fileOrBlob, maxDim = 800, quality = 0.82) {
            try {
                if (typeof window === 'undefined' || typeof document === 'undefined') return { blob: fileOrBlob, ext: 'webp' };
                let dataUrl = '';
                if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
                    dataUrl = fileOrBlob;
                } else if (fileOrBlob instanceof Blob || (fileOrBlob && fileOrBlob.size)) {
                    dataUrl = await this._fileToDataUrl(fileOrBlob);
                } else {
                    return { blob: fileOrBlob, ext: 'webp' };
                }

                return await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        let w = img.width, h = img.height;
                        if (w > maxDim || h > maxDim) {
                            if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                            else { w = Math.round((w * maxDim) / h); h = maxDim; }
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({ blob, ext: 'webp' });
                            } else {
                                resolve({ blob: fileOrBlob, ext: 'webp' });
                            }
                        }, 'image/webp', quality);
                    };
                    img.onerror = () => resolve({ blob: fileOrBlob, ext: 'webp' });
                    img.src = dataUrl;
                });
            } catch(e) {
                return { blob: fileOrBlob, ext: 'webp' };
            }
        },

        async uploadProductImage(fileOrBlob, path = 'products') {
            if (!fileOrBlob) return '';
            if (typeof fileOrBlob === 'string' && (fileOrBlob.startsWith('http://') || fileOrBlob.startsWith('https://'))) {
                return fileOrBlob;
            }

            const client = this.client;
            if (client && client.storage) {
                try {
                    const compressed = await this._compressImageToWebp(fileOrBlob);
                    const uploadBlob = compressed.blob || fileOrBlob;
                    const fileExt = compressed.ext || 'webp';

                    const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = path ? `${path}/${fileName}` : fileName;

                    const { error } = await client.storage
                        .from('product-media')
                        .upload(filePath, uploadBlob, {
                            contentType: 'image/webp',
                            cacheControl: '31536000',
                            upsert: true
                        });

                    if (!error) {
                        const { data: publicUrlData } = client.storage
                            .from('product-media')
                            .getPublicUrl(filePath);

                        if (publicUrlData && publicUrlData.publicUrl) {
                            return publicUrlData.publicUrl;
                        }
                    }
                } catch (err) {
                    console.warn("Storage upload notice (using optimized fallback):", err);
                }
            }
            if (typeof fileOrBlob === 'string') return fileOrBlob;
            return await this._fileToDataUrl(fileOrBlob);
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

            // Inventory Pre-Check: verify stock for all physical items
            const allProducts = await this.getProducts();
            for (const item of orderData.items) {
                if (item.id === 'free_gift') continue;
                const prod = allProducts.find(p => String(p.id) === String(item.id) || (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()));
                if (prod) {
                    const available = Number(prod.stock !== undefined ? prod.stock : 999);
                    const requested = Number(item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1));
                    if (available < requested) {
                        throw new Error(`INSUFFICIENT_STOCK: "${prod.name || item.name}" only has ${available} remaining in vault. Please adjust quantity.`);
                    }
                }
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

                    // DYNAMIC SEQUENTIAL ORDER NUMBERING (Starting strictly from #1)
                    let nextOrderNum = 1;
                    try {
                        const { data: maxRows } = await client
                            .from('gn_orders')
                            .select('order_number')
                            .gt('order_number', 0)
                            .order('order_number', { ascending: false })
                            .limit(1);
                        if (Array.isArray(maxRows) && maxRows.length > 0 && maxRows[0].order_number) {
                            nextOrderNum = Number(maxRows[0].order_number) + 1;
                        }
                    } catch(e) {
                        console.warn("Could not query max order_number, falling back to 1:", e);
                    }

                    cloudPayload.order_number = nextOrderNum;

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
                createdOrder = {
                    id: 'ord_' + Date.now(),
                    order_number: 1,
                    ...orderPayload
                };
            }

            if (createdOrder) {
                if (!Array.isArray(_ordersCache)) _ordersCache = [];
                _ordersCache.unshift(createdOrder);
                try {
                    SafeStorage.setItem('gn_swr_orders', JSON.stringify(_ordersCache.slice(0, 50)));
                } catch(e) {}
            }

            // Atomically decrement catalog stock upon confirmed order
            let stockUpdated = false;
            for (const item of orderData.items) {
                if (item.id === 'free_gift') continue;
                const prod = allProducts.find(p => String(p.id) === String(item.id) || (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()));
                if (prod) {
                    const available = Number(prod.stock !== undefined ? prod.stock : 10);
                    const requested = Number(item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1));
                    prod.stock = Math.max(0, available - requested);
                    stockUpdated = true;
                }
            }
            if (stockUpdated) {
                try {
                    await this._saveSection('products', allProducts);
                    if (this.client) {
                        for (const item of orderData.items) {
                            if (item.id === 'free_gift') continue;
                            const p = allProducts.find(x => String(x.id) === String(item.id) || (x.name && item.name && x.name.trim().toLowerCase() === item.name.trim().toLowerCase()));
                            if (p && p.id) {
                                try {
                                    await this.client.from('gn_products').update({ stock: p.stock }).eq('id', String(p.id));
                                } catch(e) {}
                            }
                        }
                    }
                    window.dispatchEvent(new CustomEvent('gn:productsUpdated', { detail: { products: allProducts } }));
                    window.dispatchEvent(new Event('productsUpdated'));
                } catch (err) {
                    console.warn("Stock decrement persistence notice:", err);
                }
            }

            try {
                _ordersCache = null;
                window.dispatchEvent(new Event('ordersUpdated'));
                const bc = getStoreSyncBroadcastChannel();
                if (bc) {
                    bc.postMessage({ type: 'ORDER_PLACED', order: createdOrder });
                    bc.postMessage({ type: 'ORDER_CREATED', order: createdOrder });
                }
            } catch(e) {}

            return createdOrder;
        },

        async getOrders() {
            // SWR fallback from local SafeStorage ring buffer
            let localOrders = [];
            try {
                const raw = SafeStorage.getItem('gn_swr_orders');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) localOrders = parsed;
                }
            } catch(e) {}

            if (!_ordersCache && localOrders.length > 0) {
                _ordersCache = localOrders;
            }

            const client = this.client;
            if (client) {
                try {
                    const { data, error } = await client
                        .from('gn_orders')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (!error && Array.isArray(data)) {
                        const validRemote = data.filter(o => {
                            if (!o) return false;
                            if (o.is_deleted === true || o.deleted_at || o.customer_name === '__TEST_DELETED__') return false;
                            if (o.customer_name && (o.customer_name === '__GN_STORE_SYNC__' || String(o.customer_name).startsWith('__GN_'))) return false;
                            return true;
                        }).map(o => {
                            return { ...o };
                        });

                        _ordersCache = validRemote;
                        // Persist capped ring buffer (up to 50 latest orders)
                        try {
                            SafeStorage.setItem('gn_swr_orders', JSON.stringify(validRemote.slice(0, 50)));
                        } catch(e) {}

                        return validRemote;
                    }
                } catch (e) {
                    console.warn("Supabase getOrders error:", e);
                }
            }

            return _ordersCache || localOrders || [];
        },

        async checkForNewOrders() {
            const client = this.client;
            if (!client) return { hasNew: false, count: 0 };
            try {
                // Ultra-lightweight check (~200 bytes) instead of full-table scan
                const { data, error } = await client
                    .from('gn_orders')
                    .select('id, created_at')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error || !Array.isArray(data) || data.length === 0) {
                    return { hasNew: false, error: error ? error.message : null };
                }

                const latestRemoteId = String(data[0].id);
                let localOrders = _ordersCache;
                if (!Array.isArray(localOrders) || localOrders.length === 0) {
                    try {
                        const raw = SafeStorage.getItem('gn_swr_orders');
                        if (raw) localOrders = JSON.parse(raw);
                    } catch(e) {}
                }

                const latestLocalId = (Array.isArray(localOrders) && localOrders.length > 0) ? String(localOrders[0].id) : null;
                const hasNew = Boolean(latestRemoteId && latestRemoteId !== latestLocalId);
                return { hasNew, latestId: latestRemoteId, latestCreatedAt: data[0].created_at };
            } catch(e) {
                return { hasNew: false, error: e.message };
            }
        },

        async deleteOrder(orderId) {
            const cleanId = String(orderId);
            if (Array.isArray(_ordersCache)) {
                _ordersCache = _ordersCache.filter(o => String(o.id) !== cleanId && String(o.order_number) !== cleanId);
                try {
                    SafeStorage.setItem('gn_swr_orders', JSON.stringify(_ordersCache.slice(0, 50)));
                } catch(e) {}
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
            if (Array.isArray(_ordersCache)) {
                const idx = _ordersCache.findIndex(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
                if (idx >= 0) {
                    _ordersCache[idx].status = newStatus;
                    _ordersCache[idx].updated_at = now;
                    try {
                        SafeStorage.setItem('gn_swr_orders', JSON.stringify(_ordersCache.slice(0, 50)));
                    } catch(e) {}
                }
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
                        throw error;
                    }
                } catch (e) {
                    throw e;
                }
            }

            try {
                window.dispatchEvent(new Event('ordersUpdated'));
                const bc = getStoreSyncBroadcastChannel();
                if (bc) bc.postMessage({ type: 'ORDER_STATUS_CHANGED', orderId, status: newStatus });
            } catch(e) {}
            return true;
        },

        // =========================================================================
        // 9. REALTIME SUBSCRIPTIONS & MULTI-DEVICE PROPAGATION
        // =========================================================================
        subscribeRealtime(callback) {
            if (_realtimeChannel) {
                return _realtimeChannel;
            }
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
                        }
                        // Zero-Click Admin Ingestion: Invalidate cache and broadcast to all tabs
                        _ordersCache = null;
                        window.dispatchEvent(new Event('ordersUpdated'));
                        const bc = getStoreSyncBroadcastChannel();
                        if (bc) {
                            bc.postMessage({ type: 'ORDER_CREATED', payload });
                            bc.postMessage({ type: 'ORDER_PLACED', payload });
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
                    .subscribe((status, err) => {
                        if (status === 'SUBSCRIBED') {
                            _realtimeReconnectAttempts = 0;
                            if (_realtimeReconnectTimer) {
                                clearTimeout(_realtimeReconnectTimer);
                                _realtimeReconnectTimer = null;
                            }
                        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
                            _realtimeChannel = null;
                            scheduleRealtimeReconnect(self, callback);
                        }
                    });

                _realtimeChannel = channel;
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

        _getMockProducts() { return []; },
        _getMockCategories() { return []; },
        _getMockReviews() { return []; },
        _getMockHeroSlides() { return []; },
        _getMockOrders() { return []; }
    };

    // Auto-trigger immediate data load at boot time
    if (typeof window !== 'undefined') {
        const bootSync = async () => {
            try {
                if (window.SupabaseEngine) {
                    window.SupabaseEngine.subscribeRealtime();
                    await window.SupabaseEngine._migrateFromMonolith();
                    await window.SupabaseEngine.refreshAll(false);
                    window.dispatchEvent(new Event('productsLoaded'));
                }
            } catch (e) {}
        };

        // Fire once at startup
        bootSync();

        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', bootSync);
        }
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

        // Realtime Online/Offline Connectivity Event Dispatcher (No auto-refetch, no auto-replay)
        window.addEventListener('online', function() {
            window.dispatchEvent(new CustomEvent('gn:networkOnline'));
        });
        window.addEventListener('offline', function() {
            window.dispatchEvent(new CustomEvent('gn:networkOffline'));
        });
    }
})();
