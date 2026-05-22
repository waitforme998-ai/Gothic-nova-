/* dashboard-engine.js - Premium Gothic Nova Master Hub Interaction & Simulation Engine */

document.addEventListener('DOMContentLoaded', () => {
    // --- ATMOSPHERIC INERTIA SPOTLIGHTS ---
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const spotlights = document.querySelectorAll('.spotlight');
    if (spotlights.length >= 2) {
        if (isTouchDevice) {
            spotlights.forEach(s => s.style.display = 'none');
        } else {
            let mouseX = window.innerWidth / 2;
            let mouseY = window.innerHeight / 2;
            let spotX1 = -200, spotY1 = -200;
            let spotX2 = -200, spotY2 = -200;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            const updateSpotlights = () => {
                // Spring physics interpolation
                spotX1 += (mouseX * 0.08 - spotX1) * 0.05;
                spotY1 += (mouseY * 0.08 - spotY1) * 0.05;
                spotX2 += (-mouseX * 0.08 - spotX2) * 0.05;
                spotY2 += (-mouseY * 0.08 - spotY2) * 0.05;

                spotlights[0].style.transform = `translate(${spotX1}px, ${spotY1}px)`;
                spotlights[1].style.transform = `translate(${spotX2}px, ${spotY2}px)`;

                requestAnimationFrame(updateSpotlights);
            };
            requestAnimationFrame(updateSpotlights);
        }
    }

    // Navbar scroll interaction state
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }

    // --- SATISFYING LOAD & MONEY TICKER ANIMATIONS ---
    const animateValue = (element, start, end, duration, suffix = '', prefix = '') => {
        if (!element) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(easeProgress * (end - start) + start);
            
            if (prefix === 'Rs. ') {
                element.textContent = prefix + value.toLocaleString();
            } else {
                element.textContent = prefix + (progress === 1 ? end : value) + suffix;
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // Find stat titles and hook animations
    const statsHeaders = document.querySelectorAll('h2');
    if (statsHeaders.length >= 3) {
        // Animate Capacity (94%)
        const capHeading = statsHeaders[0];
        capHeading.id = 'stat-capacity';
        animateValue(capHeading, 0, 94, 2000, '% Forged');

        // Animate Revenue (Rs. 1,489,000)
        const revHeading = statsHeaders[1];
        revHeading.id = 'stat-revenue';
        animateValue(revHeading, 0, 1489000, 2500, '', 'Rs. ');

        // Animate Sold Out (98.4%)
        const soldHeading = statsHeaders[2];
        soldHeading.id = 'stat-sold';
        // Handle float for sold out
        let startTimestamp = null;
        const stepFloat = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / 2000, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const value = (easeProgress * 98.4).toFixed(1);
            soldHeading.textContent = value + '% Sold Out';
            if (progress < 1) {
                window.requestAnimationFrame(stepFloat);
            }
        };
        window.requestAnimationFrame(stepFloat);
    }

    // --- CHART BAR ANIMATIONS ---
    const chartBars = document.querySelectorAll('.mt-4.flex.items-end > div');
    chartBars.forEach((bar, index) => {
        // Read the target class heights and convert to heights
        let targetHeight = '10%';
        if (bar.classList.contains('h-[30%]')) targetHeight = '30%';
        else if (bar.classList.contains('h-[40%]')) targetHeight = '40%';
        else if (bar.classList.contains('h-[50%]')) targetHeight = '50%';
        else if (bar.classList.contains('h-[60%]')) targetHeight = '60%';
        else if (bar.classList.contains('h-[70%]')) targetHeight = '70%';
        else if (bar.classList.contains('h-[85%]')) targetHeight = '85%';
        else if (bar.classList.contains('h-[90%]')) targetHeight = '90%';
        else if (bar.classList.contains('h-[100%]')) targetHeight = '100%';

        bar.style.height = '0%';
        bar.style.transition = `height 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 100}ms`;
        
        setTimeout(() => {
            bar.style.height = targetHeight;
        }, 150);

        // Hover tooltip
        bar.addEventListener('mouseenter', (e) => {
            bar.style.filter = 'brightness(1.5)';
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-background border border-primary/40 text-primary font-mono text-[10px] px-2 py-1 rounded shadow-lg -translate-y-8 transition-opacity duration-300 pointer-events-none glass';
            tooltip.id = `chart-tooltip-${index}`;
            tooltip.textContent = `Rs. ${(Math.random() * 200000 + 100000).toFixed(0)}`;
            bar.parentNode.appendChild(tooltip);
            
            const rect = bar.getBoundingClientRect();
            const parentRect = bar.parentNode.getBoundingClientRect();
            tooltip.style.left = `${rect.left - parentRect.left + (rect.width / 2) - 30}px`;
        });

        bar.addEventListener('mouseleave', () => {
            bar.style.filter = 'none';
            const tooltip = document.getElementById(`chart-tooltip-${index}`);
            if (tooltip) tooltip.remove();
        });
    });

    // --- ALERTS SYSTEM LOG ENGINE ---
    const alertsList = document.querySelector('.mt-stack-lg ul');
    const pushAlert = (title, message, isWarning = false) => {
        if (!alertsList) return;
        const li = document.createElement('li');
        li.className = 'flex gap-4 opacity-0 -translate-y-2 transition-all duration-500';
        
        const dotColor = isWarning ? 'bg-primary' : 'bg-green-400';
        const shadowColor = isWarning ? 'rgba(99,102,241,0.8)' : 'rgba(74,222,128,0.5)';
        
        li.innerHTML = `
            <div class="w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 shrink-0" style="box-shadow: 0 0 8px ${shadowColor}"></div>
            <p class="text-sm text-on-surface/70"><span class="text-white font-bold">${title}</span> ${message}</p>
        `;
        
        alertsList.insertBefore(li, alertsList.firstChild);
        
        // Trigger smooth slide in
        setTimeout(() => {
            li.classList.remove('opacity-0', '-translate-y-2');
        }, 50);

        // Keep alert list capped at 6 items to prevent overflow
        if (alertsList.children.length > 6) {
            alertsList.lastChild.remove();
        }
    };

    // Make the Argon replenishment alert interactive
    const alertItems = document.querySelectorAll('.mt-stack-lg li');
    alertItems.forEach(item => {
        if (item.textContent.includes('Argon Supply Low')) {
            const p = item.querySelector('p');
            if (p) {
                const button = document.createElement('button');
                button.className = 'ml-4 px-2 py-0.5 border border-primary/40 text-primary font-mono text-[9px] hover:bg-primary hover:text-white transition-all uppercase rounded-sm inline-block';
                button.textContent = 'REPLENISH';
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    button.disabled = true;
                    button.textContent = 'CHARGING...';
                    button.style.borderColor = 'rgba(74,222,128,0.4)';
                    button.style.color = '#4ade80';

                    setTimeout(() => {
                        item.style.opacity = '0';
                        item.style.transform = 'translateX(-20px)';
                        setTimeout(() => {
                            item.remove();
                            pushAlert('SYSTEM STABLE', 'Argon replenishment in Chamber 02 complete. Pressure nominal [1.2 GPa].', false);
                            
                            // Visual upgrade to Capacity stat card
                            const capText = document.getElementById('stat-capacity');
                            if (capText) {
                                capText.textContent = '98% Forged';
                                const capBar = document.querySelector('.mt-6.h-1.w-full div');
                                if (capBar) capBar.style.width = '98%';
                            }
                        }, 500);
                    }, 1200);
                });
                p.appendChild(button);
            }
        }
    });

    // --- DYNAMIC DETAIL DRAWER FOR QUEUE ITEMS ---
    const drawer = document.getElementById('detailsDrawer');
    const drawerCloseBtn = document.getElementById('drawerClose');
    const drawerTitle = document.getElementById('drawerTitle');
    const drawerArtisan = document.getElementById('drawerArtisan');
    const drawerImage = document.getElementById('drawerImage');
    const drawerSpec = document.getElementById('drawerSpec');
    const drawerProgressText = document.getElementById('drawerProgressText');
    const drawerProgressBar = document.getElementById('drawerProgressBar');
    const doubleSpeedBtn = document.getElementById('doubleSpeedBtn');
    
    let activeCardForDrawer = null;

    const closeDrawer = () => {
        if (!drawer) return;
        drawer.classList.add('translate-x-full');
        setTimeout(() => {
            drawer.classList.add('hidden');
        }, 500);
        activeCardForDrawer = null;
    };

    if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener('click', closeDrawer);
    }

    // Document-level escape key listener to close drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    // Queue Card Clicking to Open Drawer
    const queueCards = document.querySelectorAll('#active-forging-queue .glass');
    queueCards.forEach(card => {
        // Prevent clicking the prioritize button from opening the drawer
        const prioritizeBtn = card.querySelector('button');
        
        card.addEventListener('click', (e) => {
            if (e.target === prioritizeBtn || prioritizeBtn.contains(e.target)) return;

            const title = card.querySelector('h4').textContent;
            const artisan = card.querySelector('.text-on-surface\x2f40').textContent;
            const imgSrc = card.querySelector('img').getAttribute('src');
            const progress = card.querySelector('.space-y-2 span:last-child').textContent;
            const specText = title === 'Venom Spider Ring' ? '92.5% Silver, 7.5% Titanium Alloy base with deep obsidian filigree set in 960°C forging.' :
                             title === 'Crimson Cross Choker' ? 'Premium hand-finished oxidized silver cross with custom laser engraving and micro-joints.' :
                             'Complex structural dual-helix titanium chain linked using micro-welding in vacuum environments.';

            activeCardForDrawer = card;

            // Populate drawer
            if (drawerTitle) drawerTitle.textContent = title;
            if (drawerArtisan) drawerArtisan.textContent = artisan;
            if (drawerSpec) drawerSpec.textContent = specText;
            if (drawerImage) drawerImage.setAttribute('src', imgSrc);
            if (drawerProgressText) drawerProgressText.textContent = progress;
            if (drawerProgressBar) drawerProgressBar.style.width = progress;

            // Open drawer
            if (drawer) {
                drawer.classList.remove('hidden');
                setTimeout(() => {
                    drawer.classList.remove('translate-x-full');
                }, 50);
            }
        });
    });

    // --- OPERATIONAL CONTROL PANEL IN DRAWER ---
    if (doubleSpeedBtn) {
        doubleSpeedBtn.addEventListener('click', () => {
            if (!activeCardForDrawer) return;
            
            doubleSpeedBtn.disabled = true;
            doubleSpeedBtn.textContent = 'HYPER-DRIVE ON';
            doubleSpeedBtn.classList.remove('border-primary\x2f40', 'text-primary');
            doubleSpeedBtn.classList.add('bg-primary', 'text-white', 'crimson-glow');

            const title = activeCardForDrawer.querySelector('h4').textContent;
            pushAlert('FORGE SPEEDUP', `${title} production rate has been set to 500% speed. Laser calibration active.`, false);

            // Speed up the progress bar in the card and drawer
            const progressNumNode = activeCardForDrawer.querySelector('.space-y-2 span:last-child');
            const cardProgressBar = activeCardForDrawer.querySelector('.crimson-gradient');
            
            activeCardForDrawer.dataset.hyperDrive = "true";

            setTimeout(() => {
                doubleSpeedBtn.disabled = false;
                doubleSpeedBtn.textContent = 'DOUBLESPEED FORGE';
                doubleSpeedBtn.classList.add('border-primary\x2f40', 'text-primary');
                doubleSpeedBtn.classList.remove('bg-primary', 'text-white', 'crimson-glow');
            }, 5000);
        });
    }

    // --- PRIORITIZE BUTTON ENGINE ---
    const prioritizeBtns = document.querySelectorAll('#active-forging-queue button');
    prioritizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.glass');
            const title = card.querySelector('h4').textContent;

            if (card.dataset.prioritized === "true") {
                // Remove prioritization
                card.dataset.prioritized = "false";
                card.style.border = '';
                card.style.boxShadow = '';
                btn.textContent = 'Prioritize';
                btn.style.backgroundColor = '';
                btn.style.color = '';
                
                const priorityBadge = card.querySelector('.priority-badge');
                if (priorityBadge) priorityBadge.remove();

                pushAlert('RUN DE-PRIORITIZED', `${title} forge status reset to queue standard.`, true);
            } else {
                // Set prioritization
                card.dataset.prioritized = "true";
                card.style.border = '1px solid #6366f1';
                card.style.boxShadow = '0 0 25px rgba(99, 102, 241, 0.45)';
                btn.textContent = 'DE-PRIORITIZE';
                btn.style.backgroundColor = '#6366f1';
                btn.style.color = '#ffffff';

                // Add glass priority badge dynamically
                const badge = document.createElement('span');
                badge.className = 'priority-badge absolute top-2 right-2 px-2 py-0.5 bg-primary/20 border border-primary text-[8px] font-mono text-primary rounded-sm pulse-dot';
                badge.textContent = 'PRIORITY RUN';
                card.appendChild(badge);

                pushAlert('RUN PRIORITIZED', `${title} has been moved to primary laser chamber. Expected completion: <2 mins.`, false);
            }
        });
    });

    // --- DYNAMIC FORGING SIMULATOR ---
    setInterval(() => {
        const activeCards = document.querySelectorAll('#active-forging-queue .glass');
        activeCards.forEach(card => {
            const progressNumNode = card.querySelector('.space-y-2 span:last-child');
            const cardProgressBar = card.querySelector('.crimson-gradient');
            if (!progressNumNode || !cardProgressBar) return;

            let currentProgress = parseInt(progressNumNode.textContent);
            if (currentProgress >= 100) {
                // Reset/Recycle simulation after complete
                currentProgress = 0;
                card.classList.remove('brightness-125');
            }

            // Calculate progress increment
            let increment = Math.random() * 0.8 + 0.2; // default slow
            if (card.dataset.prioritized === "true") {
                increment += 2.5; // prioritized speedup
            }
            if (card.dataset.hyperDrive === "true") {
                increment += 5.0; // drawer speedup
            }

            let nextProgress = Math.min(currentProgress + increment, 100);
            progressNumNode.textContent = `${Math.floor(nextProgress)}%`;
            cardProgressBar.style.width = `${nextProgress}%`;

            // Update drawer if active
            if (activeCardForDrawer === card) {
                if (drawerProgressText) drawerProgressText.textContent = `${Math.floor(nextProgress)}%`;
                if (drawerProgressBar) drawerProgressBar.style.width = `${nextProgress}%`;
            }

            // Trigger completion effect
            if (nextProgress >= 100 && currentProgress < 100) {
                const title = card.querySelector('h4').textContent;
                pushAlert('FORGE COMPLETE', `${title} has successfully completed forging process. Sent to polishing tier.`, false);
                
                // Pulsing success flash
                card.classList.add('brightness-125');
                card.style.borderColor = '#00ff66';
                card.style.boxShadow = '0 0 30px rgba(0, 255, 102, 0.4)';
                
                // Dynamic money increase simulation
                const revText = document.getElementById('stat-revenue');
                if (revText) {
                    const price = title === 'Venom Spider Ring' ? 3499 : title === 'Crimson Cross Choker' ? 4499 : 5999;
                    const oldVal = parseInt(revText.textContent.replace(/[^0-9]/g, ''));
                    animateValue(revText, oldVal, oldVal + price, 1000, '', 'Rs. ');
                }

                setTimeout(() => {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                    card.dataset.hyperDrive = "false";
                }, 4000);
            }
        });
    }, 2000);

    // --- INTERACTIVE ELITE COMMISSION PIPELINE ---
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
        const badge = row.querySelector('span');
        if (!badge) return;

        // Visual enhancement: cursor pointer and click instruction hover
        badge.style.cursor = 'pointer';
        badge.title = 'Click to advance forging pipeline stage';

        badge.addEventListener('click', () => {
            const currentStage = badge.textContent.trim();
            const orderNum = row.querySelector('td').textContent;
            
            let nextStage = 'HEATING';
            let classes = '';

            if (currentStage === 'HEATING') {
                nextStage = 'ENGRAVING';
                classes = 'inline-block px-2 py-1 bg-primary-container/20 border border-primary-container text-primary-container font-label-caps text-[9px] rounded-sm';
            } else if (currentStage === 'ENGRAVING') {
                nextStage = 'POLISHING';
                classes = 'inline-block px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-label-caps text-[9px] rounded-sm';
            } else if (currentStage === 'POLISHING') {
                nextStage = 'SHIPPED';
                classes = 'inline-block px-2 py-1 bg-white/5 border border-white/20 text-on-surface/80 font-label-caps text-[9px] rounded-sm';
            } else {
                nextStage = 'HEATING';
                classes = 'inline-block px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-label-caps text-[9px] rounded-sm';
            }

            badge.textContent = nextStage;
            badge.className = classes;

            pushAlert('PIPELINE UPDATE', `Commission ${orderNum} advanced to ${nextStage}.`, false);
        });
    });

    // --- TAB MENU FILTER FUNCTIONALITY ---
    const tabButtons = document.querySelectorAll('.mb-stack-lg button');
    const sections = {
        forges: document.querySelector('#active-forging-queue'),
        commissions: document.querySelector('#commissions-queue')
    };

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => {
                b.classList.remove('bg-primary/10', 'text-primary', 'border-b-2', 'border-primary');
                b.classList.add('text-on-surface/50');
            });
            btn.classList.add('bg-primary/10', 'text-primary', 'border-b-2', 'border-primary');
            btn.classList.remove('text-on-surface/50');

            const tabName = btn.textContent.trim();
            if (tabName === 'ALL FORGES') {
                sections.forges.style.display = 'block';
                sections.commissions.style.display = 'block';
                // Adjust layout
                sections.forges.closest('.grid').classList.add('lg:grid-cols-12');
                sections.forges.className = 'lg:col-span-7';
                sections.commissions.className = 'lg:col-span-5';
            } else if (tabName === 'ACTIVE DROPS') {
                sections.forges.style.display = 'none';
                sections.commissions.style.display = 'block';
                sections.forges.closest('.grid').classList.remove('lg:grid-cols-12');
                sections.commissions.className = 'w-full max-w-[800px] mx-auto';
            } else if (tabName === 'COMMISSIONS') {
                sections.forges.style.display = 'none';
                sections.commissions.style.display = 'block';
                sections.forges.closest('.grid').classList.remove('lg:grid-cols-12');
                sections.commissions.className = 'w-full max-w-[800px] mx-auto';
            } else { // PENDING RUNS
                sections.forges.style.display = 'block';
                sections.commissions.style.display = 'none';
                sections.forges.closest('.grid').classList.remove('lg:grid-cols-12');
                sections.forges.className = 'w-full max-w-[800px] mx-auto';
            }
        });
    });
});
