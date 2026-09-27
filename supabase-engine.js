// supabase-engine.js
// GOTHIC NOVA - Enterprise Dual-Mode & Live Supabase Data Adapter
// Seamlessly bridges Supabase PostgreSQL Cloud & LocalStorage fallback

(function() {
    const DEFAULT_SUPABASE_URL = 'https://ogjyubekshcxcirlboue.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nanl1YmVrc2hjeGNpcmxib3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzU3NzIsImV4cCI6MjEwNTIxMTc3Mn0.DgLLeJfRhTgJhJsDhj5LSmxjk9U7q7FYskX-QB10BiM';

    const SUPABASE_URL = localStorage.getItem('gn_supabase_url') || DEFAULT_SUPABASE_URL; 
    const SUPABASE_ANON_KEY = localStorage.getItem('gn_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY; 
    
    let supabase = null;

    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
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

    // Default Seed Catalog
    const defaultCatalog = [
        { id: "1", name: "Venom Spider Ring", category: "rings", img: "assets/venom_spider_ring.png", price: 3499, sale_price: null, stock: 15, threshold: 3, description: "Intricate spider silhouette ring cast in 316L solid surgical steel.", active: true, display_order: 1 },
        { id: "2", name: "Crimson Cross", category: "chains", img: "assets/crimson_cross_choker.png", price: 5999, sale_price: 4499, stock: 8, threshold: 3, description: "Heavyweight gothic cross choker with crimson blood-drop stone inlay.", active: true, display_order: 2 },
        { id: "3", name: "Obsidian Helix", category: "chains", img: "assets/obsidian_helix_chain.png", price: 5999, sale_price: null, stock: 12, threshold: 3, description: "Interlocking matte obsidian link chain with industrial quick-release clasp.", active: true, display_order: 3 },
        { id: "4", name: "Shadow Claw", category: "rings", img: "assets/shadow_claw_ring.png", price: 3899, sale_price: null, stock: 0, threshold: 3, description: "Full-finger articulated talon ring engineered for effortless movement.", active: true, display_order: 4 },
        { id: "5", name: "Spine Bracelet", category: "bracelets", img: "assets/spine_bracelet.png", price: 6899, sale_price: null, stock: 5, threshold: 3, description: "Vertebrae link bracelet with gothic cyber-matte finish.", active: true, display_order: 5 },
        { id: "6", name: "Reaper Pendant", category: "pendants", img: "assets/reaper_pendant.png", price: 8999, sale_price: 7499, stock: 15, threshold: 3, description: "Solid onyx and stainless steel reaper emblem with 60cm rope chain.", active: true, display_order: 6 }
    ];

    // Default Seed Categories
    const defaultCategories = [
        { id: "chains", name: "Chains", display_order: 1 },
        { id: "rings", name: "Rings", display_order: 2 },
        { id: "bracelets", name: "Bracelets", display_order: 3 },
        { id: "pendants", name: "Pendants", display_order: 4 }
    ];

    // Default Seed Reviews (Unified Author and Customer Name fields)
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

    // Default Seed Hero Slides (Synchronized Hero Artworks)
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

    window.SupabaseEngine = {
        client: supabase,
        isLive: !!supabase,

        // =========================================================================
        // 1. PRODUCTS API
        // =========================================================================
        async getProducts() {
            let deletedProds = new Set();
            try {
                const rawDel = localStorage.getItem('gn_deleted_products');
                if (rawDel) JSON.parse(rawDel).forEach(id => deletedProds.add(String(id)));
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('gn_products')
                        .select('*')
                        .order('display_order', { ascending: true })
                        .order('created_at', { ascending: true });
                    
                    if (error) throw error;
                    
                    if (data && Array.isArray(data)) {
                        const normalized = data.filter(p => p && !deletedProds.has(String(p.id))).map(p => ({
                            ...p,
                            salePrice: p.sale_price !== undefined ? p.sale_price : p.salePrice,
                            sale_price: p.sale_price !== undefined ? p.sale_price : p.salePrice
                        }));
                        localStorage.setItem('gn_products', JSON.stringify(normalized));
                        return normalized;
                    }
                } catch (err) {
                    console.warn("Supabase fetch products notice:", err);
                }
            }
            return this._getMockProducts().filter(p => p && !deletedProds.has(String(p.id)));
        },

        async saveProduct(product) {
            const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
            const dbPayload = {
                id: String(product.id || Date.now()),
                name: product.name,
                category: product.category || 'rings',
                price: Number(product.price || 0),
                sale_price: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                stock: Number(product.stock !== undefined ? product.stock : 10),
                threshold: Number(product.threshold !== undefined ? product.threshold : 3),
                description: product.description || '',
                img: product.img || 'assets/reaper_pendant.png',
                stock_images: stock_images,
                active: product.active !== false,
                display_order: Number(product.display_order || product.displayOrder || 1)
            };

            this._saveMockProduct({ ...dbPayload, salePrice: dbPayload.sale_price, stock_images: stock_images, stockImages: stock_images });

            if (this.isLive && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('gn_products')
                        .upsert(dbPayload)
                        .select();
                    if (error) console.warn("Supabase saveProduct warning:", error);
                    return data || [dbPayload];
                } catch (err) {
                    console.warn("Supabase saveProduct error, saved locally:", err);
                    return [dbPayload];
                }
            }
            return [dbPayload];
        },

        async deleteProduct(id) {
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_products') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(String(id));
                localStorage.setItem('gn_deleted_products', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            this._deleteMockProduct(String(id));
            if (this.isLive && supabase) {
                try {
                    const { error } = await supabase
                        .from('gn_products')
                        .delete()
                        .eq('id', String(id));
                    if (error) console.warn("Supabase deleteProduct warning:", error);
                } catch (err) {
                    console.warn("Supabase deleteProduct error:", err);
                }
            }
            return true;
        },

        async saveProductsBulk(productsArray) {
            const dbPayloads = productsArray.map((product, idx) => {
                const stock_images = Array.isArray(product.stock_images) ? product.stock_images : (Array.isArray(product.stockImages) ? product.stockImages : []);
                return {
                    id: String(product.id || (Date.now() + idx)),
                    name: product.name,
                    category: product.category || 'rings',
                    price: Number(product.price || 0),
                    sale_price: (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== '') ? Number(product.salePrice) : ((product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== '') ? Number(product.sale_price) : null),
                    stock: Number(product.stock !== undefined ? product.stock : 10),
                    threshold: Number(product.threshold !== undefined ? product.threshold : 3),
                    description: product.description || '',
                    img: product.img || 'assets/reaper_pendant.png',
                    stock_images: stock_images,
                    active: product.active !== false,
                    display_order: Number(product.display_order || product.displayOrder || (idx + 1))
                };
            });

            let localList = this._getMockProducts();
            dbPayloads.forEach(p => {
                const norm = { ...p, salePrice: p.sale_price, stock_images: p.stock_images, stockImages: p.stock_images };
                const idx = localList.findIndex(item => String(item.id) === String(p.id));
                if (idx >= 0) localList[idx] = norm;
                else localList.push(norm);
            });
            localStorage.setItem('gn_products', JSON.stringify(localList));

            if (this.isLive) {
                try {
                    const { data, error } = await supabase
                        .from('gn_products')
                        .upsert(dbPayloads)
                        .select();
                    if (error) console.warn("Supabase bulk save warning:", error);
                    return data || dbPayloads;
                } catch (err) {
                    console.warn("Supabase bulk save error, saved locally:", err);
                    return dbPayloads;
                }
            }
            return dbPayloads;
        },

        async _seedProductsCloud() {
            if (!this.isLive) return;
            try {
                // Ensure categories exist first
                await this.getCategories();
                await supabase.from('gn_products').upsert(defaultCatalog);
            } catch (e) {
                console.warn("Auto-seed products error:", e);
            }
        },

        // =========================================================================
        // 2. CATEGORIES API
        // =========================================================================
        async getCategories() {
            if (this.isLive) {
                try {
                    const { data, error } = await supabase
                        .from('gn_categories')
                        .select('*')
                        .order('display_order', { ascending: true });
                    
                    if (error) throw error;
                    if (!data || data.length === 0) {
                        await supabase.from('gn_categories').upsert(defaultCategories);
                        return defaultCategories;
                    }
                    localStorage.setItem('gn_categories_meta', JSON.stringify(data));
                    return data;
                } catch (err) {
                    return this._getMockCategories();
                }
            }
            return this._getMockCategories();
        },

        async saveCategory(category) {
            const payload = {
                id: String(category.id).trim().toLowerCase(),
                name: category.name || category.id,
                display_order: Number(category.display_order || 0)
            };

            let localCats = this._getMockCategories();
            const idx = localCats.findIndex(c => c.id === payload.id);
            if (idx >= 0) localCats[idx] = payload;
            else localCats.push(payload);
            localStorage.setItem('gn_categories_meta', JSON.stringify(localCats));

            if (this.isLive) {
                try {
                    await supabase.from('gn_categories').upsert(payload);
                } catch (err) {
                    console.warn("Save category to Supabase error:", err);
                }
            }
            return payload;
        },

        async deleteCategory(id) {
            const cleanId = String(id).trim().toLowerCase();
            let localCats = this._getMockCategories().filter(c => c.id !== cleanId);
            localStorage.setItem('gn_categories_meta', JSON.stringify(localCats));

            if (this.isLive) {
                try {
                    await supabase.from('gn_categories').delete().eq('id', cleanId);
                } catch (err) {
                    console.warn("Delete category from Supabase error:", err);
                }
            }
        },

        // =========================================================================
        // 3. CUSTOMER REVIEWS API
        // =========================================================================
        async getReviews() {
            let deletedRevs = new Set();
            try {
                const rawDel = localStorage.getItem('gn_deleted_reviews');
                if (rawDel) JSON.parse(rawDel).forEach(id => deletedRevs.add(String(id)));
            } catch(e) {}

            if (this.isLive && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('gn_reviews')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    if (data && Array.isArray(data)) {
                        const cleaned = data.filter(r => r && !deletedRevs.has(String(r.id)));
                        localStorage.setItem('gn_reviews', JSON.stringify(cleaned));
                        return cleaned;
                    }
                } catch (err) {
                    return this._getMockReviews().filter(r => r && !deletedRevs.has(String(r.id)));
                }
            }
            return this._getMockReviews().filter(r => r && !deletedRevs.has(String(r.id)));
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

            let local = this._getMockReviews();
            const idx = local.findIndex(r => String(r.id) === String(payload.id));
            if (idx >= 0) {
                local[idx] = { ...local[idx], ...payload };
            } else {
                local.unshift(payload);
            }
            localStorage.setItem('gn_reviews', JSON.stringify(local));
            window.dispatchEvent(new Event('reviewsUpdated'));

            if (this.isLive && supabase) {
                try {
                    const { data, error } = await supabase.from('gn_reviews').upsert(payload).select();
                    if (error) console.warn("Save review error:", error);
                    return data ? data[0] : payload;
                } catch (e) {
                    console.warn("Supabase saveReview error:", e);
                }
            }
            return payload;
        },

        async deleteReview(id) {
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_reviews') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(String(id));
                localStorage.setItem('gn_deleted_reviews', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            let local = this._getMockReviews().filter(r => String(r.id) !== String(id));
            localStorage.setItem('gn_reviews', JSON.stringify(local));
            window.dispatchEvent(new Event('reviewsUpdated'));
            window.dispatchEvent(new Event('storage'));

            if (this.isLive && supabase) {
                try {
                    await supabase.from('gn_reviews').delete().eq('id', id);
                } catch (e) {
                    console.warn("Supabase deleteReview error:", e);
                }
            }
            return true;
        },

        async deleteReview(id) {
            let local = this._getMockReviews().filter(r => String(r.id) !== String(id));
            localStorage.setItem('gn_reviews', JSON.stringify(local));
            window.dispatchEvent(new Event('reviewsUpdated'));

            if (this.isLive) {
                try {
                    await supabase.from('gn_reviews').delete().eq('id', id);
                } catch (e) {
                    console.warn("Supabase deleteReview error:", e);
                }
            }
        },

        // =========================================================================
        // 4. HERO SLIDER API
        // =========================================================================
        async getHeroSlides() {
            let slides = null;
            if (this.isLive) {
                try {
                    const { data, error } = await supabase
                        .from('gn_hero_slides')
                        .select('*')
                        .order('display_order', { ascending: true });
                    
                    if (error) throw error;
                    if (data && data.length > 0) {
                        slides = data;
                    } else {
                        await supabase.from('gn_hero_slides').upsert(defaultHeroSlides);
                        slides = defaultHeroSlides;
                    }
                } catch (err) {
                    console.warn("Supabase fetch hero slides notice:", err);
                }
            }

            if (!slides || slides.length === 0) {
                slides = this._getMockHeroSlides();
            }

            // Normalization & Image Fix
            const normalized = slides.map((s, idx) => {
                let imgPath = s.image_url || s.img || s.image;
                // Fix legacy / mismatched default placeholder images (e.g. product photos or silhouette)
                const isProductOrSilhouette = !imgPath || 
                    imgPath.includes('subject_silhouette.png') || 
                    imgPath.includes('reaper_pendant.png') || 
                    imgPath.includes('crimson_cross_choker.png') || 
                    imgPath.includes('venom_spider_ring.png') || 
                    imgPath.includes('shadow_claw_ring.png') || 
                    imgPath.includes('spine_bracelet.png') || 
                    imgPath.includes('obsidian_helix_chain.png');

                if (isProductOrSilhouette) {
                    if (s.id === 's1' || idx === 0) imgPath = 'assets/hero_gothic_bg.png';
                    else if (s.id === 's2' || idx === 1) imgPath = 'assets/gothic_cathedral_bg.jpg';
                    else if (s.id === 's3' || idx === 2) imgPath = 'assets/hero_original_bg.webp';
                    else imgPath = 'assets/hero_gothic_bg.png';
                }

                const headline = s.headline || s.title || (idx === 0 ? 'GOTHIC NOVA // IMMORTAL DROP' : (idx === 1 ? 'REAPER COLLECTION' : 'CRIMSON & HELIX'));
                const subtext = s.subtext || s.subtitle || 'Gothic × Japanese Jewelry. Handcrafted artifacts.';
                const ctaText = s.button_label || s.buttonLabel || s.cta_text || (idx === 1 ? 'Shop Pendants' : (idx === 2 ? 'Explore Chains' : 'Explore Drop'));
                const ctaLink = s.button_link || s.buttonLink || s.cta_link || (idx === 1 ? 'index.html?cat=pendants' : (idx === 2 ? 'index.html?cat=chains' : '#active-drop'));
                const isActive = s.active !== undefined ? s.active : (s.is_active !== undefined ? s.is_active : true);

                return {
                    id: s.id || `s_${idx + 1}`,
                    headline,
                    title: headline,
                    subtext,
                    subtitle: subtext,
                    button_label: ctaText,
                    cta_text: ctaText,
                    button_link: ctaLink,
                    cta_link: ctaLink,
                    img: imgPath,
                    image_url: imgPath,
                    image: imgPath,
                    display_order: Number(s.display_order || s.displayOrder || idx + 1),
                    active: isActive,
                    is_active: isActive
                };
            });

            localStorage.setItem('gn_hero_slides', JSON.stringify(normalized));
            return normalized;
        },

        async saveHeroSlide(slide) {
            const rawImg = slide.image_url || slide.img || slide.image || 'assets/hero_gothic_bg.png';
            const headline = slide.headline || slide.title || 'GOTHIC NOVA';
            const subtext = slide.subtext || slide.subtitle || 'Gothic × Japanese Jewelry.';
            const ctaText = slide.button_label || slide.buttonLabel || slide.cta_text || 'Explore Drop';
            const ctaLink = slide.button_link || slide.buttonLink || slide.cta_link || '#active-drop';
            const isActive = slide.active !== undefined ? slide.active : (slide.is_active !== false);

            const payload = {
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
            if (slide.id) {
                payload.id = slide.id;
            } else {
                payload.id = 's_' + Date.now();
            }

            let local = this._getMockHeroSlides();
            const idx = local.findIndex(s => String(s.id) === String(payload.id));
            if (idx >= 0) local[idx] = payload;
            else local.push(payload);
            localStorage.setItem('gn_hero_slides', JSON.stringify(local));

            if (this.isLive) {
                try {
                    const { data, error } = await supabase.from('gn_hero_slides').upsert(payload).select();
                    if (error) console.warn("Save hero slide error:", error);
                    return data ? data[0] : payload;
                } catch (e) {
                    console.warn("Supabase saveHeroSlide error:", e);
                }
            }
            return payload;
        },

        async deleteHeroSlide(id) {
            let local = this._getMockHeroSlides().filter(s => String(s.id) !== String(id));
            localStorage.setItem('gn_hero_slides', JSON.stringify(local));

            if (this.isLive) {
                try {
                    await supabase.from('gn_hero_slides').delete().eq('id', id);
                } catch (e) {
                    console.warn("Supabase deleteHeroSlide error:", e);
                }
            }
        },

        // =========================================================================
        // 5. SUPABASE AUTH INTEGRATION
        // =========================================================================
        async signIn(email, password) {
            if (!this.isLive) {
                // Offline / Local Mock login validation
                if (password === 'gothicnova51214' || password === 'admin') {
                    const mockSession = { user: { email: email || 'admin@gothicnova.com' }, token: 'mock-jwt-token' };
                    sessionStorage.setItem('gn_admin_session', JSON.stringify(mockSession));
                    return { data: { session: mockSession, user: mockSession.user }, error: null };
                }
                return { data: null, error: { message: 'Invalid admin credentials.' } };
            }

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password
                });
                if (error) throw error;
                if (data && data.session) {
                    sessionStorage.setItem('gn_admin_session', JSON.stringify(data.session));
                }
                return { data, error: null };
            } catch (err) {
                return { data: null, error: err };
            }
        },

        async signOut() {
            sessionStorage.removeItem('gn_admin_session');
            if (this.isLive) {
                try {
                    await supabase.auth.signOut();
                } catch (e) {}
            }
        },

        async getSession() {
            if (this.isLive) {
                try {
                    const { data } = await supabase.auth.getSession();
                    if (data && data.session) return data.session;
                } catch (e) {}
            }
            const stored = sessionStorage.getItem('gn_admin_session');
            if (stored) {
                try { return JSON.parse(stored); } catch(e) {}
            }
            return null;
        },

        // =========================================================================
        // 6. STORAGE MEDIA UPLOAD
        // =========================================================================
        async uploadMedia(fileOrBase64, filename = '') {
            if (!this.isLive) return fileOrBase64;

            try {
                let blob = fileOrBase64;
                if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
                    // Convert data URL to Blob
                    const byteString = atob(fileOrBase64.split(',')[1]);
                    const mimeString = fileOrBase64.split(',')[0].split(':')[1].split(';')[0];
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                    blob = new Blob([ab], { type: mimeString });
                }

                const cleanName = (filename || 'media_' + Date.now()).replace(/[^a-zA-Z0-9_.-]/g, '_');
                const path = `uploads/${Date.now()}_${cleanName}.webp`;

                const { data, error } = await supabase.storage
                    .from('product-media')
                    .upload(path, blob, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: 'image/webp'
                    });

                if (error) {
                    console.warn("Supabase Storage upload warning, using local data URL:", error);
                    return fileOrBase64;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('product-media')
                    .getPublicUrl(path);

                return publicUrlData && publicUrlData.publicUrl ? publicUrlData.publicUrl : fileOrBase64;
            } catch (err) {
                console.warn("Storage upload exception, falling back:", err);
                return fileOrBase64;
            }
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

            let local = this._getMockReviews();
            const idx = local.findIndex(r => String(r.id) === String(payload.id));
            if (idx >= 0) {
                local[idx] = { ...local[idx], ...payload };
            } else {
                local.unshift(payload);
            }
            localStorage.setItem('gn_reviews', JSON.stringify(local));
            window.dispatchEvent(new Event('reviewsUpdated'));
            window.dispatchEvent(new Event('storage'));

            if (this.isLive) {
                try {
                    const { data, error } = await supabase.from('gn_reviews').upsert(payload).select();
                    if (error) console.warn("Save review error:", error);
                    return data ? data[0] : payload;
                } catch (e) {
                    console.warn("Supabase saveReview error:", e);
                }
            }
            return payload;
        },

        async deleteReview(id) {
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_reviews') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(String(id));
                localStorage.setItem('gn_deleted_reviews', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            let local = this._getMockReviews().filter(r => String(r.id) !== String(id));
            localStorage.setItem('gn_reviews', JSON.stringify(local));
            window.dispatchEvent(new Event('reviewsUpdated'));
            window.dispatchEvent(new Event('storage'));

            if (this.isLive && supabase) {
                try {
                    await supabase.from('gn_reviews').delete().eq('id', id);
                } catch (e) {
                    console.warn("Supabase deleteReview error:", e);
                }
            }
            return true;
        },

        async uploadProductImage(file, path) {
            if (this.isLive) {
                try {
                    const fileExt = file.name ? file.name.split('.').pop() : 'png';
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = path ? `${path}/${fileName}` : fileName;

                    const { data, error } = await supabase.storage
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
                    console.warn("Storage upload failed, converting to Base64 data URL:", err);
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

                    const { data, error } = await supabase.storage
                        .from('payment_slips')
                        .upload(filePath, fileToUpload, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) {
                        console.warn("Upload to payment_slips bucket failed, trying product-media:", error);
                        // Fallback to product-media bucket if payment_slips bucket is pending creation
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
                    console.warn("Storage upload failed, falling back to data URL:", err);
                    return await this._fileToDataUrl(fileOrBlob);
                }
            }
            return await this._fileToDataUrl(fileOrBlob);
        },

        // =========================================================================
        // 7. ORDERS MANAGEMENT (ON-SITE CHECKOUT & SUPABASE BACKEND)
        // =========================================================================
        async createOrder(orderData) {
            // Server-level validation
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
                advance_amount: orderData.advance_amount !== undefined ? Number(orderData.advance_amount) : (orderData.payment_method === 'advance' ? Number(orderData.total_amount || 0) : 250),
                deposit_paid: orderData.deposit_paid !== undefined ? Number(orderData.deposit_paid) : (orderData.payment_method === 'advance' ? Number(orderData.total_amount || 0) : 250),
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
                    console.warn("Supabase createOrder insert error, falling back to local storage:", err);
                }
            }

            if (!createdOrder) {
                // Fallback sequential order counter
                let currentCounter = Number(localStorage.getItem('gn_order_counter') || 0);
                currentCounter += 1;
                localStorage.setItem('gn_order_counter', String(currentCounter));

                createdOrder = {
                    ...orderPayload,
                    id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    order_number: currentCounter
                };
            }

            // Update local cache
            const localOrders = this._getMockOrders();
            localOrders.unshift(createdOrder);
            localStorage.setItem('gn_orders', JSON.stringify(localOrders));

            window.dispatchEvent(new Event('ordersUpdated'));
            window.dispatchEvent(new Event('storage'));

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

                        const validRemote = data.filter(o => {
                            if (!o) return false;
                            if (o.is_deleted || o.deleted_at || o.customer_name === '__TEST_DELETED__') return false;
                            if (deletedSet.has(String(o.id)) || deletedSet.has(String(o.order_number))) return false;
                            return true;
                        }).map(o => {
                            const cached = localMap[String(o.id || o.order_number)];
                            let merged = { ...o };
                            if (cached) {
                                if (cached.card_reward_applied && !o.card_reward_applied) merged.card_reward_applied = cached.card_reward_applied;
                                if (cached.status && cached.status !== o.status) {
                                    // Preserve local optimistic status change
                                    merged.status = cached.status;
                                }
                            }
                            return merged;
                        });

                        const localOnly = localOrdersList.filter(lo => 
                            lo && !deletedSet.has(String(lo.id)) && !deletedSet.has(String(lo.order_number)) &&
                            !remoteIds.has(String(lo.id)) && !remoteOrderNums.has(String(lo.order_number)) &&
                            !lo.is_deleted && !lo.deleted_at && lo.customer_name !== '__TEST_DELETED__'
                        );

                        const combined = [...validRemote, ...localOnly];
                        localStorage.setItem('gn_orders', JSON.stringify(combined));
                        return combined;
                    }
                } catch (e) {
                    console.warn("Supabase getOrders error, using local fallback:", e);
                }
            }
            return this._getMockOrders().filter(o => !deletedSet.has(String(o.id)) && !deletedSet.has(String(o.order_number)));
        },

        async deleteOrder(orderId) {
            const now = new Date().toISOString();
            try {
                let deletedList = JSON.parse(localStorage.getItem('gn_deleted_orders') || '[]');
                if (!Array.isArray(deletedList)) deletedList = [];
                deletedList.push(String(orderId));
                localStorage.setItem('gn_deleted_orders', JSON.stringify([...new Set(deletedList)]));
            } catch(e) {}

            let localOrders = this._getMockOrders();
            const targetOrder = localOrders.find(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
            if (targetOrder) {
                try {
                    let deletedList = JSON.parse(localStorage.getItem('gn_deleted_orders') || '[]');
                    if (targetOrder.id) deletedList.push(String(targetOrder.id));
                    if (targetOrder.order_number) deletedList.push(String(targetOrder.order_number));
                    localStorage.setItem('gn_deleted_orders', JSON.stringify([...new Set(deletedList)]));
                } catch(e) {}
            }
            
            // Clean up Supabase Storage file if screenshot was attached
            if (this.isLive && supabase && targetOrder && targetOrder.payment_screenshot_url) {
                try {
                    const url = targetOrder.payment_screenshot_url;
                    if (url.includes('/payment_slips/') || url.includes('/product-media/')) {
                        const parts = url.split('/payment_slips/');
                        if (parts.length > 1) {
                            const fileName = parts[1].split('?')[0];
                            await supabase.storage.from('payment_slips').remove([fileName, `slips/${fileName}`]);
                        }
                    }
                } catch (err) {
                    console.warn("Supabase storage slip removal notice:", err);
                }
            }

            localOrders = localOrders.filter(o => String(o.id) !== String(orderId) && String(o.order_number) !== String(orderId));
            localStorage.setItem('gn_orders', JSON.stringify(localOrders));

            if (this.isLive && supabase) {
                try {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
                    let delRes = null;
                    if (isUuid) {
                        delRes = await supabase.from('gn_orders').delete().eq('id', orderId);
                    } else if (!isNaN(Number(orderId))) {
                        delRes = await supabase.from('gn_orders').delete().eq('order_number', Number(orderId));
                    } else {
                        delRes = await supabase.from('gn_orders').delete().eq('id', orderId);
                    }

                    if (delRes && delRes.error) {
                        // Fallback soft delete
                        if (isUuid) {
                            await supabase.from('gn_orders').update({ is_deleted: true, deleted_at: now, customer_name: '__TEST_DELETED__', status: 'Cancelled' }).eq('id', orderId);
                        } else if (!isNaN(Number(orderId))) {
                            await supabase.from('gn_orders').update({ is_deleted: true, deleted_at: now, customer_name: '__TEST_DELETED__', status: 'Cancelled' }).eq('order_number', Number(orderId));
                        }
                    }
                } catch (e) {
                    console.warn("Supabase deleteOrder exception:", e);
                }
            }
            return true;
        },

        async updateOrderStatus(orderId, newStatus) {
            const validStatuses = ['Pending', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Invalid status: ${newStatus}`);
            }

            const now = new Date().toISOString();
            let localOrders = this._getMockOrders();
            const idx = localOrders.findIndex(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
            if (idx >= 0) {
                localOrders[idx].status = newStatus;
                localOrders[idx].updated_at = now;
                localStorage.setItem('gn_orders', JSON.stringify(localOrders));
            }

            if (this.isLive && supabase) {
                try {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
                    if (isUuid) {
                        await supabase.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('id', orderId);
                    } else if (!isNaN(Number(orderId))) {
                        await supabase.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('order_number', Number(orderId));
                    } else {
                        await supabase.from('gn_orders').update({ status: newStatus, updated_at: now }).eq('id', orderId);
                    }
                } catch (e) {
                    console.warn("Supabase updateOrderStatus exception:", e);
                }
            }

            return idx >= 0 ? localOrders[idx] : null;
        },

        // =========================================================================
        // 7. REALTIME SUBSCRIPTIONS
        // =========================================================================
        subscribeRealtime(callback) {
            if (!this.isLive || !supabase) return null;

            try {
                const channel = supabase
                    .channel('schema-db-changes')
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
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'gn_orders' }, payload => {
                        window.dispatchEvent(new Event('ordersUpdated'));
                        if (callback) callback({ type: 'order', payload });
                    })
                    .subscribe();

                return channel;
            } catch (e) {
                console.warn("Realtime subscription error:", e);
                return null;
            }
        },

        // =========================================================================
        // 8. LOCAL MOCK FALLBACKS
        // =========================================================================
        _getMockProducts() {
            try {
                const raw = localStorage.getItem('gn_products');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('gn_products', JSON.stringify(defaultCatalog));
            return defaultCatalog;
        },

        _saveMockProduct(p) {
            let list = this._getMockProducts();
            const idx = list.findIndex(item => String(item.id) === String(p.id));
            if (idx >= 0) list[idx] = p;
            else list.push(p);
            localStorage.setItem('gn_products', JSON.stringify(list));
        },

        _deleteMockProduct(id) {
            let list = this._getMockProducts().filter(p => String(p.id) !== String(id));
            localStorage.setItem('gn_products', JSON.stringify(list));
        },

        _getMockCategories() {
            try {
                const raw = localStorage.getItem('gn_categories_meta');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('gn_categories_meta', JSON.stringify(defaultCategories));
            return defaultCategories;
        },

        _getMockReviews() {
            try {
                const raw = localStorage.getItem('gn_reviews');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('gn_reviews', JSON.stringify(defaultReviews));
            return defaultReviews;
        },

        _getMockHeroSlides() {
            try {
                const raw = localStorage.getItem('gn_hero_slides');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('gn_hero_slides', JSON.stringify(defaultHeroSlides));
            return defaultHeroSlides;
        },

        _getMockOrders() {
            try {
                let deletedSet = new Set();
                try {
                    const rawDel = localStorage.getItem('gn_deleted_orders');
                    if (rawDel) JSON.parse(rawDel).forEach(id => deletedSet.add(String(id)));
                } catch(e) {}

                const raw = localStorage.getItem('gn_orders');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        const isMock = (o) => {
                            if (!o) return true;
                            if (o.is_deleted || o.deleted_at || o.customer_name === '__TEST_DELETED__') return true;
                            if (deletedSet.has(String(o.id)) || deletedSet.has(String(o.order_number))) return true;
                            if (o.is_sample || o.is_dummy || o.is_mock) return true;
                            const name = String(o.customer_name || '').toLowerCase().trim();
                            if (name === 'taha siddiqui' || name === 'danyal zafar' || name === 'sara bilal' || name === 'ali raza' || name === 'test customer' || name === 'asad ali (test)') return true;
                            const id = String(o.id || '');
                            if (id === 'ord_101' || id === 'ord_102' || id === 'ord_103' || id === 'ord_live_test') return true;
                            return false;
                        };
                        const cleaned = parsed.filter(o => !isMock(o));
                        if (cleaned.length !== parsed.length) {
                            localStorage.setItem('gn_orders', JSON.stringify(cleaned));
                        }
                        return cleaned;
                    }
                }
            } catch(e) {}
            return [];
        }
    };

    // Auto trigger initial products check & load event
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await window.SupabaseEngine.getProducts();
            await window.SupabaseEngine.getCategories();
            await window.SupabaseEngine.getReviews();
            await window.SupabaseEngine.getHeroSlides();
            window.dispatchEvent(new Event('productsLoaded'));
        } catch (e) {
            console.error("Initial load error:", e);
        }
    });

    // =========================================================================
    // 7. GOTHIC NOVA ENTERPRISE CUSTOM DIALOG & TOAST MODAL SYSTEM
    // Completely replaces native alert(), confirm(), prompt() — NO "localhost says" or "domain says"
    // =========================================================================
    function getOrCreateLuxuryDialogContainer() {
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

    window.showLuxuryAlert = function(msg, title = 'GOTHIC NOVA', onConfirm) {
        const overlay = getOrCreateLuxuryDialogContainer();
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

        // Quick auto-dismiss for copied notifications
        if (title === 'COPIED' || title === 'NOTIFICATION' || title === 'COPIED TO CLIPBOARD') {
            setTimeout(() => {
                if (overlay.style.display === 'flex') closeDialog();
            }, 1800);
        }
    };

    window.showLuxuryConfirm = function({ title = 'GOTHIC NOVA', message, confirmText = 'Confirm', isDanger = true, onConfirm, onCancel }) {
        const overlay = getOrCreateLuxuryDialogContainer();
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

    // Global override of window.alert to intercept any native alert calls
    window.alert = function(msg) {
        window.showLuxuryAlert(msg);
    };

})();
