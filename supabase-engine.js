// supabase-engine.js
// Handles Dual-Mode Data fetching: Mockup (localStorage) vs Live (Supabase)

(function() {
    // These can be injected here for Vercel deployment,
    // OR set via localStorage in the browser console.
    const SUPABASE_URL = localStorage.getItem('gn_supabase_url') || 'https://ronpiwedkthgjakjnzhw.supabase.co'; 
    const SUPABASE_ANON_KEY = localStorage.getItem('gn_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbnBpd2Vka3RoZ2pha2puemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDc3NDMsImV4cCI6MjA5NTAyMzc0M30.3Iin84RfxpF5OK4x9g-85XxNRweR9NTnS7CeBoHJfvo';  
    
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
                    .from('gn_products')
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
                    .from('gn_products')
                    .upsert(product)
                    .select();
                if (error) {
                    console.error("Supabase upsert error:", error);
                    throw error;
                }
                return data;
            } else {
                return this._saveMockProduct(product);
            }
        },

        async deleteProduct(id) {
            if (this.isLive) {
                const { error } = await supabase
                    .from('gn_products')
                    .delete()
                    .eq('id', id);
                if (error) {
                    console.error("Supabase delete error:", error);
                    throw error;
                }
            } else {
                this._deleteMockProduct(id);
            }
        },

        // --- Mockup Fallbacks ---
        _getMockProducts() {
            const stored = localStorage.getItem('gn_products');
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch(e) {
                    console.error("Failed to parse mock products", e);
                }
            }
            return []; // Relies on seed logic elsewhere if empty
        },

        _saveMockProduct(product) {
            let products = this._getMockProducts();
            const existingIndex = products.findIndex(p => p.id === product.id);
            if (existingIndex >= 0) {
                products[existingIndex] = product;
            } else {
                products.push(product);
            }
            localStorage.setItem('gn_products', JSON.stringify(products));
            return [product];
        },

        _deleteMockProduct(id) {
            let products = this._getMockProducts();
            products = products.filter(p => p.id !== id);
            localStorage.setItem('gn_products', JSON.stringify(products));
        }
    };

})();
