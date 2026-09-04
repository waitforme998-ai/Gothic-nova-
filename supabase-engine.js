// supabase-engine.js — Velora Dual-Mode Data Engine
// Handles Mockup (localStorage) vs Live (Supabase)

(function() {
    const SUPABASE_URL = localStorage.getItem('vl_supabase_url') || '';
    const SUPABASE_ANON_KEY = localStorage.getItem('vl_supabase_anon_key') || '';
    
    let supabase = null;

    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase engine initialized in LIVE mode.");
    } else {
        console.log("Supabase engine initialized in MOCKUP mode (localStorage fallback).");
    }

    window.SupabaseEngine = {
        isLive: !!supabase,
        
        async getProducts() {
            if (this.isLive) {
                const { data, error } = await supabase
                    .from('vl_products')
                    .select('*')
                    .order('id', { ascending: true });
                if (error) {
                    console.error("Supabase fetch error:", error);
                    return this._getMockProducts();
                }
                return data;
            } else {
                return this._getMockProducts();
            }
        },

        async saveProduct(product) {
            if (this.isLive) {
                const { data, error } = await supabase
                    .from('vl_products')
                    .upsert(product)
                    .select();
                if (error) { console.error("Supabase upsert error:", error); throw error; }
                return data;
            } else {
                return this._saveMockProduct(product);
            }
        },

        async deleteProduct(id) {
            if (this.isLive) {
                const { error } = await supabase
                    .from('vl_products')
                    .delete()
                    .eq('id', id);
                if (error) { console.error("Supabase delete error:", error); throw error; }
            } else {
                this._deleteMockProduct(id);
            }
        },

        _getMockProducts() {
            const stored = localStorage.getItem('vl_products');
            if (stored) {
                try { return JSON.parse(stored); } catch(e) { console.error("Parse error", e); }
            }
            return [];
        },

        _saveMockProduct(product) {
            let products = this._getMockProducts();
            if (product.id) {
                const idx = products.findIndex(p => p.id === product.id);
                if (idx > -1) products[idx] = product;
                else products.push(product);
            } else {
                product.id = Date.now().toString();
                products.push(product);
            }
            localStorage.setItem('vl_products', JSON.stringify(products));
            return [product];
        },

        _deleteMockProduct(id) {
            let products = this._getMockProducts().filter(p => p.id !== id);
            localStorage.setItem('vl_products', JSON.stringify(products));
        }
    };
})();
