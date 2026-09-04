// scroll-engine.js — Velora Luxury Smooth Scroll & Reveal Engine
// Elegant, non-jarring easeInOutCubic scrolling for all category clicks and navigation.

(function() {
    'use strict';

    let isAutoScrolling = false;
    let autoScrollRaf = null;

    // Elegant easeInOutCubic easing for luxury deceleration and acceleration
    function easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Smoothly and elegantly scrolls to an element, selector, or Y coordinate.
     * @param {string|HTMLElement|number} target - The target element, selector, or Y offset.
     * @param {Object} options - Custom options { duration, offset, callback, event }
     */
    function elegantScrollTo(target, options = {}) {
        // If event was passed, prevent default teleport
        if (options.event && options.event.preventDefault) {
            options.event.preventDefault();
        }

        let targetY = 0;
        const nav = document.querySelector('.main-nav');
        const navHeight = nav ? nav.offsetHeight : 76;
        const extraOffset = options.offset !== undefined ? options.offset : -16;

        if (typeof target === 'number') {
            targetY = target;
        } else {
            let el = typeof target === 'string' ? document.querySelector(target) : target;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const currentY = window.pageYOffset || document.documentElement.scrollTop;
            targetY = Math.max(0, rect.top + currentY - navHeight + extraOffset);
        }

        const startY = window.pageYOffset || document.documentElement.scrollTop;
        const distance = targetY - startY;

        // If distance is tiny, don't trigger heavy animation
        if (Math.abs(distance) < 6) {
            if (options.callback) options.callback();
            return;
        }

        // Adaptive duration based on distance (600ms to 950ms)
        const baseDuration = options.duration || Math.min(Math.max(Math.abs(distance) * 0.45, 600), 950);
        let startTime = null;

        // Cancel any prior running auto-scroll
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

    // Cancel auto-scroll if user manually wheels/touches during animation
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

    // Global expose
    window.elegantScrollTo = elegantScrollTo;

    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveals();
        initStickyNav();
        initAnchorIntercept();
        initReviewsTrackPause();
    });

    // Fully Touch-Scrollable Continuous Auto-Scroller for Reviews
    function initReviewsTrackPause() {
        const slider = document.querySelector('.reviews-slider-container');
        if (!slider) return;

        let isInteracting = false;
        let resumeTimer = null;
        const scrollSpeed = 0.75; // Smooth luxury velocity (pixels per frame)

        function tick() {
            if (!isInteracting) {
                slider.scrollLeft += scrollSpeed;
                const halfWidth = slider.scrollWidth / 2;
                if (halfWidth > 0 && slider.scrollLeft >= halfWidth) {
                    slider.scrollLeft -= halfWidth;
                }
            }
            requestAnimationFrame(tick);
        }

        const pause = () => {
            isInteracting = true;
            if (resumeTimer) clearTimeout(resumeTimer);
        };

        const resume = () => {
            if (resumeTimer) clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                isInteracting = false;
            }, 600); // 600ms after finger lift, smoothly continue auto-scroll
        };

        // Mobile touch listeners (passive for native 60fps scrolling)
        slider.addEventListener('touchstart', pause, { passive: true });
        slider.addEventListener('touchmove', pause, { passive: true });
        slider.addEventListener('touchend', resume, { passive: true });
        slider.addEventListener('touchcancel', resume, { passive: true });

        // Desktop mouse drag & hover listeners
        let isMouseDown = false;
        let startX = 0;
        let startScroll = 0;

        slider.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            pause();
            startX = e.pageX - slider.offsetLeft;
            startScroll = slider.scrollLeft;
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDown) {
                isMouseDown = false;
                resume();
            }
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5;
            slider.scrollLeft = startScroll - walk;
        });

        slider.addEventListener('mouseenter', pause);
        slider.addEventListener('mouseleave', resume);

        requestAnimationFrame(tick);
    }

    // Intercept all internal anchor clicks to prevent native teleportation jumps
    function initAnchorIntercept() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const targetEl = document.querySelector(href);
            if (targetEl) {
                e.preventDefault();
                elegantScrollTo(targetEl, { event: e });
            }
        });
    }

    function initScrollReveals() {
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        if (!revealElements.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -40px 0px',
            threshold: 0.08
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const siblings = entry.target.parentElement?.querySelectorAll('.reveal-on-scroll');
                    let index = 0;
                    if (siblings) {
                        index = Array.from(siblings).indexOf(entry.target);
                    }
                    const delay = Math.min(index * 60, 300);

                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, delay);

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => revealObserver.observe(el));
    }

    function initStickyNav() {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }
        }, { passive: true });
    }
})();

