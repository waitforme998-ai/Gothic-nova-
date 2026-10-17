/* scroll-engine.js - Ultra-High-Performance Scroll & Interaction Engine
 * Features:
 * 1. Global IntersectionObserver for staggered reveals
 * 2. RAF-throttled passive scroll listener for navbar and desktop hero parallax fade
 * 3. Desktop 3D Card Tilt & Radial Mouse Spotlight (Bypassed on mobile to preserve 60fps)
 * 4. Interactive Reviews Track Pause on Touch / Hover
 * 5. Elegant easeInOutCubic smooth scroll engine
 */

(function() {
    'use strict';

    // 1. Global High-Performance Reveal Observer
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
        rootMargin: '50px 0px 50px 0px'
    });
    window.revealObserver = revealObserver;

    // 2. Luxury easeInOutCubic Smooth Scroll Engine
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    let isAutoScrolling = false;
    let autoScrollRaf = null;

    function elegantScrollTo(target, options = {}) {
        if (options.event && options.event.preventDefault) {
            options.event.preventDefault();
        }

        let targetY = 0;
        const nav = document.querySelector('.navbar') || document.querySelector('.main-nav');
        const navHeight = nav ? nav.offsetHeight : 70;
        const extraOffset = options.offset !== undefined ? options.offset : -12;

        if (typeof target === 'number') {
            targetY = target;
        } else {
            const el = typeof target === 'string' ? document.querySelector(target) : target;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const currentY = window.pageYOffset || document.documentElement.scrollTop;
            targetY = Math.max(0, rect.top + currentY - navHeight + extraOffset);
        }

        const startY = window.pageYOffset || document.documentElement.scrollTop;
        const distance = targetY - startY;

        if (Math.abs(distance) < 6) {
            if (options.callback) options.callback();
            return;
        }

        const baseDuration = options.duration || Math.min(Math.max(Math.abs(distance) * 0.45, 500), 850);
        let startTime = null;

        if (autoScrollRaf) {
            cancelAnimationFrame(autoScrollRaf);
            autoScrollRaf = null;
        }

        isAutoScrolling = true;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / baseDuration, 1);
            const ease = easeInOutCubic(progress);

            window.scrollTo(0, startY + (distance * ease));

            if (progress < 1 && isAutoScrolling) {
                autoScrollRaf = requestAnimationFrame(step);
            } else {
                isAutoScrolling = false;
                autoScrollRaf = null;
                if (options.callback) options.callback();
            }
        }

        autoScrollRaf = requestAnimationFrame(step);
    }

    function handleUserInterrupt() {
        if (isAutoScrolling) {
            isAutoScrolling = false;
            if (autoScrollRaf) {
                cancelAnimationFrame(autoScrollRaf);
                autoScrollRaf = null;
            }
        }
    }

    window.addEventListener('wheel', handleUserInterrupt, { passive: true });
    window.addEventListener('touchmove', handleUserInterrupt, { passive: true });
    window.elegantScrollTo = elegantScrollTo;

    document.addEventListener('DOMContentLoaded', () => {
        const navbar = document.querySelector('.navbar');
        const heroSection = document.querySelector('.hero-section');
        const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;

        // 3. RAF-Throttled Passive Scroll Handler (Navbar state & Desktop Hero Fade)
        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateScrollVisuals() {
            const scrollY = window.scrollY;
            const isScrolled = scrollY > 40;

            if (navbar) {
                navbar.classList.toggle('navbar-scrolled', isScrolled);
            }

            // Desktop Parallax Fade: Only fade out fixed hero on screens > 768px to avoid mobile opacity conflicts
            if (heroSection && window.innerWidth > 768) {
                const fadeThreshold = window.innerHeight * 0.45;
                const opacity = Math.max(0, 1 - (scrollY / fadeThreshold));
                heroSection.style.opacity = opacity;
            } else if (heroSection && heroSection.style.opacity !== '') {
                // Reset on mobile to full opacity in normal flow
                heroSection.style.opacity = '';
            }

            lastScrollY = scrollY;
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollVisuals);
                ticking = true;
            }
        }, { passive: true });

        // Run once on load
        updateScrollVisuals();

        // 4. Desktop 3D Card Tilt & Dynamic Mouse Spotlight (Strictly bypassed on mobile for touch performance)
        if (!isTouchDevice) {
            const dropGrid = document.querySelector('.drop-grid') || document.getElementById('main-drop-grid');
            if (dropGrid) {
                dropGrid.addEventListener('mousemove', (e) => {
                    const card = e.target.closest('.product-card');
                    if (!card || card.classList.contains('card-sold-out')) return;

                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const mouseX = (x / rect.width) * 100;
                    const mouseY = (y / rect.height) * 100;
                    card.style.setProperty('--mouse-x', `${mouseX.toFixed(1)}%`);
                    card.style.setProperty('--mouse-y', `${mouseY.toFixed(1)}%`);

                    const xPct = (x / rect.width) - 0.5;
                    const yPct = (y / rect.height) - 0.5;

                    const img = card.querySelector('.card-img');
                    if (img) {
                        img.style.transform = `scale(1.04) translate3d(${xPct * 8}px, ${yPct * 8}px, 0)`;
                    }
                });

                dropGrid.addEventListener('mouseout', (e) => {
                    const card = e.target.closest('.product-card');
                    if (!card) return;

                    const related = e.relatedTarget;
                    if (related && card.contains(related)) return;

                    card.style.setProperty('--mouse-x', '50%');
                    card.style.setProperty('--mouse-y', '50%');
                    const img = card.querySelector('.card-img');
                    if (img) {
                        img.style.transform = 'scale(1) translate3d(0, 0, 0)';
                    }
                });
            }
        }

        // 5. Interactive Reviews Track Touch & Hover Pause
        const reviewsTrack = document.querySelector('.reviews-track') || document.getElementById('customer-reviews-track');
        if (reviewsTrack) {
            const pauseTrack = () => {
                reviewsTrack.classList.add('is-paused');
                reviewsTrack.style.animationPlayState = 'paused';
            };
            const resumeTrack = () => {
                reviewsTrack.classList.remove('is-paused');
                reviewsTrack.style.animationPlayState = 'running';
            };

            reviewsTrack.addEventListener('mouseenter', pauseTrack);
            reviewsTrack.addEventListener('mouseleave', resumeTrack);
            reviewsTrack.addEventListener('touchstart', pauseTrack, { passive: true });
            reviewsTrack.addEventListener('touchend', resumeTrack, { passive: true });
            reviewsTrack.addEventListener('touchcancel', resumeTrack, { passive: true });
        }

        // 6. Observe existing static elements in DOM
        document.querySelectorAll('.reveal-element, .reveal-on-scroll').forEach(el => {
            window.revealObserver.observe(el);
        });
    });
})();
