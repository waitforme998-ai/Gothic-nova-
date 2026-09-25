/* scroll-engine.js - Ultra-High-Performance Scroll & Interaction Engine */

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    root: null,
    threshold: 0.05,
    rootMargin: '100px 0px 100px 0px'
});
window.revealObserver = revealObserver;

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    
    // Lightweight passive scroll handler for navbar state (only fires when crossing 40px)
    let lastScrolledState = false;
    window.addEventListener('scroll', () => {
        const isScrolled = window.scrollY > 40;
        if (isScrolled !== lastScrolledState) {
            lastScrolledState = isScrolled;
            if (navbar) {
                if (isScrolled) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
            }
        }
    }, { passive: true });

    // Observe existing static elements in DOM
    document.querySelectorAll('.reveal-element').forEach(el => {
        window.revealObserver.observe(el);
    });
});
