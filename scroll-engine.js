/* scroll-engine.js - Custom Inertia and Interactive Typography Engine */

// Initialize and expose observer globally at top level to prevent timing race conditions with dynamic products
const revealObserver = new IntersectionObserver((entries, observer) => {
    let visibleCount = 0;
    entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
            el.style.transitionDelay = `${visibleCount * 50}ms`;
            el.classList.add('is-visible');
            visibleCount++;
        } else {
            el.classList.remove('is-visible');
            el.style.transitionDelay = '0ms';
        }
    });
}, {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});
window.revealObserver = revealObserver;

document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll interaction state
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero-section');
    
    window.addEventListener('scroll', () => {
        // Navbar Scrolled State
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }

        // Parallax Fade for Hero Section Overlap Effect
        if (heroSection) {
            const scrollY = window.scrollY;
            // Fade out the hero text and elements completely over 40% of viewport height
            const fadeThreshold = window.innerHeight * 0.4;
            const opacity = Math.max(0, 1 - (scrollY / fadeThreshold));
            heroSection.style.opacity = opacity;
        }
    });

    // --- CATEGORY FILTER ENGINE ---
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    window.runFilterTab = function() {
        const activeTab = document.querySelector('.filter-tab.active');
        if (!activeTab) return;
        const targetCategory = activeTab.getAttribute('data-filter');
        const productWrappers = document.querySelectorAll('motion-div[data-category]');

        productWrappers.forEach(wrapper => {
            const itemCategory = wrapper.getAttribute('data-category');
            
            if (targetCategory === 'all' || itemCategory === targetCategory) {
                // Make visible and fade in
                wrapper.style.display = 'block';
                setTimeout(() => {
                    wrapper.style.opacity = '1';
                    wrapper.style.transform = 'translateY(0) scale(1)';
                }, 50);
            } else {
                // Fade out and hide
                wrapper.style.opacity = '0';
                wrapper.style.transform = 'translateY(30px) scale(0.95)';
                setTimeout(() => {
                    wrapper.style.display = 'none';
                }, 400); // matches transition time
            }
        });
    };

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            window.runFilterTab();
        });
    });

    // --- PRODUCT CARD 3D TILT EFFECT & DYNAMIC MOUSE SPOTLIGHT (EVENT DELEGATION) ---
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const dropGrid = document.querySelector('.drop-grid');
    
    if (!isTouchDevice && dropGrid) {
        dropGrid.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.product-card');
            if (!card || card.classList.contains('card-sold-out')) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Mouse coordinates in percentage for dynamic radial spotlight glow
            const mouseX = (x / rect.width) * 100;
            const mouseY = (y / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${mouseX}%`);
            card.style.setProperty('--mouse-y', `${mouseY}%`);

            const xPct = (x / rect.width) - 0.5;
            const yPct = (y / rect.height) - 0.5;
            
            const img = card.querySelector('.card-img');
            if (img) {
                img.style.transform = `scale(1.05) translateX(${xPct * 12}px) translateY(${yPct * 12}px)`;
            }
        });

        dropGrid.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            
            // Check if we really left the card
            const related = e.relatedTarget;
            if (related && card.contains(related)) return;

            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
            const img = card.querySelector('.card-img');
            if (img) {
                img.style.transform = 'scale(1) translateX(0) translateY(0)';
            }
        });
    }

    // --- STAGGERED SCROLL-TRIGGERED REVEALS ---
    const revealElements = document.querySelectorAll('.reveal-element');
    
    // Observe existing static elements in DOM
    revealElements.forEach(el => {
        window.revealObserver.observe(el);
    });
});
