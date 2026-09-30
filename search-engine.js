/**
 * GOTHIC NOVA - REAL-TIME SEARCH ENGINE MODULE
 * 
 * Features:
 * - Real-time as-you-type live filtering with 280ms debounce
 * - Multi-field weighted scoring (Name: 100, Category: 50, Description: 10)
 * - Case-insensitive partial word matching
 * - Client-side in-memory search across live product catalog
 * - Mobile-first results dropdown with thumbnail, title, price & category
 * - Top 6 matches limit with "See all X results" link
 * - "No products found for '[query]'" empty state
 * - Clear '✕' button inside search input
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - Accessible ARIA combobox pattern
 */

(function() {
    'use strict';

    function initSearchEngine() {
        const searchInputs = document.querySelectorAll('.search-input');
        if (!searchInputs || searchInputs.length === 0) return;

        searchInputs.forEach(input => {
            setupSearchInput(input);
        });
    }

    function getLiveProducts() {
        if (typeof window.getAllProducts === 'function') {
            return window.getAllProducts();
        }
        if (Array.isArray(window.gn_products) && window.gn_products.length > 0) {
            return window.gn_products;
        }
        try {
            const raw = localStorage.getItem('gn_products');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [];
    }

    function setupSearchInput(input) {
        if (input.dataset.searchEngineAttached) return;
        input.dataset.searchEngineAttached = 'true';

        // Ensure accessibility
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-label', 'Search products');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');

        const wrapper = input.closest('.search-wrapper') || input.parentElement;
        if (!wrapper) return;

        wrapper.style.position = 'relative';

        // Inject Clear 'X' Button if not present
        let clearBtn = wrapper.querySelector('.search-clear-btn');
        if (!clearBtn) {
            clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'search-clear-btn';
            clearBtn.setAttribute('aria-label', 'Clear search');
            clearBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            wrapper.appendChild(clearBtn);
        }

        // Inject Dropdown Container
        let dropdown = wrapper.querySelector('.search-dropdown-results');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown-results';
            dropdown.setAttribute('role', 'listbox');
            dropdown.setAttribute('aria-label', 'Search results');
            wrapper.appendChild(dropdown);
        }

        let debounceTimer = null;
        let activeIndex = -1;

        function closeDropdown() {
            dropdown.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
            activeIndex = -1;
            highlightActiveItem();
        }

        function openDropdown() {
            dropdown.classList.add('active');
            input.setAttribute('aria-expanded', 'true');
        }

        function highlightActiveItem() {
            const items = dropdown.querySelectorAll('.search-result-item');
            items.forEach((item, idx) => {
                if (idx === activeIndex) {
                    item.classList.add('selected');
                    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        function performSearch(query) {
            query = (query || '').trim().toLowerCase();
            
            if (!query) {
                closeDropdown();
                clearBtn.style.display = 'none';
                return;
            }

            clearBtn.style.display = 'flex';

            const products = getLiveProducts();
            if (!products || products.length === 0) {
                dropdown.innerHTML = `
                    <div class="search-empty-state font-mono">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p>Catalog is loading...</p>
                    </div>
                `;
                openDropdown();
                return;
            }

            const queryWords = query.split(/\s+/).filter(Boolean);

            // Load category metadata for display name mapping
            let catList = [];
            try {
                const rawCats = localStorage.getItem('gn_categories_meta');
                if (rawCats) catList = JSON.parse(rawCats);
            } catch(e) {}

            // Multi-field weighted scoring across ALL attributes
            const scored = [];

            products.forEach(p => {
                if (p.status && p.status !== 'active') return;

                const name = (p.name || '').toLowerCase();
                const catSlug = (p.category || '').toLowerCase();
                const catObj = Array.isArray(catList) ? catList.find(c => String(c.id).toLowerCase() === catSlug) : null;
                const catDisplayName = (catObj ? catObj.name : '').toLowerCase();
                const desc = (p.description || p.desc || p.details || '').toLowerCase();
                const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : String(p.tags || '').toLowerCase();
                const material = (p.material || '').toLowerCase();
                const priceStr = String(p.price || '');
                const salePriceStr = String(p.salePrice || '');

                const combinedBlob = `${name} ${catSlug} ${catDisplayName} ${desc} ${tags} ${material} ${priceStr} ${salePriceStr}`;

                let score = 0;
                let matchesAllWords = true;

                // Check entire query phrase match
                if (combinedBlob.includes(query)) {
                    score += 150;
                }

                // Check individual words
                for (const word of queryWords) {
                    let wordMatched = false;

                    if (name.includes(word)) {
                        score += 120;
                        if (name.startsWith(word)) score += 60;
                        wordMatched = true;
                    }
                    if (catSlug.includes(word) || catDisplayName.includes(word)) {
                        score += 70;
                        if (catSlug.startsWith(word) || catDisplayName.startsWith(word)) score += 35;
                        wordMatched = true;
                    }
                    if (desc.includes(word)) {
                        score += 40;
                        wordMatched = true;
                    }
                    if (tags.includes(word) || material.includes(word)) {
                        score += 30;
                        wordMatched = true;
                    }
                    if (priceStr.includes(word) || salePriceStr.includes(word)) {
                        score += 20;
                        wordMatched = true;
                    }

                    if (!wordMatched) {
                        matchesAllWords = false;
                        break;
                    }
                }

                if (matchesAllWords && score > 0) {
                    scored.push({ product: p, score });
                }
            });

            // Sort by score descending
            scored.sort((a, b) => b.score - a.score);

            if (scored.length === 0) {
                const safeQuery = escapeHtml(query);
                dropdown.innerHTML = `
                    <div class="search-empty-state">
                        <div class="search-empty-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                        </div>
                        <p class="search-empty-title">No products found for "${safeQuery}"</p>
                        <p class="search-empty-sub">Check spelling or explore other gothic collections</p>
                    </div>
                `;
                openDropdown();
                activeIndex = -1;
                return;
            }

            // Top matches (limit to 6)
            const MAX_RESULTS = 6;
            const topMatches = scored.slice(0, MAX_RESULTS);
            const totalCount = scored.length;

            let html = `<div class="search-results-list">`;

            topMatches.forEach((item, index) => {
                const p = item.product;
                const safeId = escapeHtml(p.id);
                const safeName = escapeHtml(p.name);
                const safeCat = escapeHtml(p.category || 'artifact');
                const safeImg = escapeHtml(p.img || 'assets/venom_spider_ring.png');
                const price = Number(p.price || 0);
                const salePrice = p.salePrice || p.saleprice;
                const hasSale = salePrice && Number(salePrice) < price;
                const isSoldOut = Number(p.stock || 0) <= 0;

                let priceHtml = '';
                if (hasSale) {
                    priceHtml = `
                        <span class="search-item-sale font-mono">Rs. ${Number(salePrice).toLocaleString('en-PK')}</span>
                        <span class="search-item-orig font-mono">Rs. ${price.toLocaleString('en-PK')}</span>
                    `;
                } else {
                    priceHtml = `<span class="search-item-price font-mono">Rs. ${price.toLocaleString('en-PK')}</span>`;
                }

                html += `
                    <div class="search-result-item" role="option" data-product-id="${safeId}" data-index="${index}" tabindex="-1">
                        <div class="search-item-thumb">
                            <img src="${safeImg}" alt="${safeName}" loading="lazy" width="40" height="40" onerror="this.onerror=null;this.src='assets/venom_spider_ring.png';">
                        </div>
                        <div class="search-item-info">
                            <div class="search-item-header">
                                <span class="search-item-title">${highlightMatch(safeName, queryWords)}</span>
                                <span class="search-item-category">${safeCat}</span>
                            </div>
                            <div class="search-item-bottom">
                                ${priceHtml}
                                ${isSoldOut ? '<span class="search-item-soldout font-mono">SOLD OUT</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;

            if (totalCount > MAX_RESULTS) {
                html += `
                    <div class="search-footer-action">
                        <button type="button" class="search-see-all-btn font-mono" onclick="if(window.applySearchQueryAndScroll) window.applySearchQueryAndScroll('${escapeHtml(query)}');">
                            SEE ALL ${totalCount} RESULTS →
                        </button>
                    </div>
                `;
            }

            dropdown.innerHTML = html;
            openDropdown();
            activeIndex = -1;

            // Attach click listeners to result items
            const resultElements = dropdown.querySelectorAll('.search-result-item');
            resultElements.forEach(el => {
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const pid = this.dataset.productId;
                    handleResultSelection(pid);
                });
            });
        }

        function handleResultSelection(productId) {
            closeDropdown();
            input.value = '';
            clearBtn.style.display = 'none';

            if (typeof window.navigateToProductCard === 'function') {
                window.navigateToProductCard(productId);
            } else {
                const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('product-search-highlight');
                    setTimeout(() => card.classList.remove('product-search-highlight'), 3600);
                }
            }
        }

        function highlightMatch(text, words) {
            if (!words || words.length === 0) return text;
            let result = text;
            words.forEach(word => {
                if (!word) return;
                const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
                result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
            });
            return result;
        }

        function escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function escapeHtml(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        // Input event with 280ms debounce
        input.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const val = this.value;
            debounceTimer = setTimeout(() => {
                performSearch(val);
            }, 280);
        });

        // Focus event
        input.addEventListener('focus', function() {
            if (this.value.trim().length > 0) {
                performSearch(this.value);
            }
        });

        // Clear button click
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            input.value = '';
            clearBtn.style.display = 'none';
            closeDropdown();
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        });

        // Keyboard Navigation
        input.addEventListener('keydown', function(e) {
            const items = dropdown.querySelectorAll('.search-result-item');
            const itemCount = items.length;

            if (e.key === 'ArrowDown') {
                if (!dropdown.classList.contains('active') && this.value.trim().length > 0) {
                    performSearch(this.value);
                    return;
                }
                e.preventDefault();
                if (itemCount === 0) return;
                activeIndex = (activeIndex + 1) % itemCount;
                highlightActiveItem();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (itemCount === 0) return;
                activeIndex = (activeIndex - 1 + itemCount) % itemCount;
                highlightActiveItem();
            } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && activeIndex < itemCount) {
                    e.preventDefault();
                    const selected = items[activeIndex];
                    if (selected) {
                        const pid = selected.dataset.productId;
                        handleResultSelection(pid);
                    }
                } else if (this.value.trim()) {
                    // Filter in-page on single-page storefront
                    e.preventDefault();
                    closeDropdown();
                    if (typeof window.applySearchQueryAndScroll === 'function') {
                        window.applySearchQueryAndScroll(this.value.trim());
                    }
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeDropdown();
                input.blur();
            }
        });

        // Click outside dismiss
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                closeDropdown();
            }
        });
    }

    // Expose globally for dynamic initializations & live re-indexing
    window.initSearchEngine = initSearchEngine;
    window.SearchEngine = {
        init: initSearchEngine,
        getLiveProducts: getLiveProducts,
        reindexCatalog: function() {
            initSearchEngine();
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('productsUpdated', initSearchEngine);
        window.addEventListener('categoriesUpdated', initSearchEngine);
    }

})();
