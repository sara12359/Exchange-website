/**
 * Fiscal Architect 2.0 - Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Core logic initializing...');

    // --- Theme Controller ---
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const updateThemeUI = (isDark) => {
        if (themeIcon) {
            themeIcon.innerText = isDark ? 'light_mode' : 'dark_mode';
        }
    };

    const toggleTheme = () => {
        const isDark = html.classList.toggle('dark');
        html.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeUI(isDark);
        console.log('Theme toggled. Dark mode:', isDark);
    };

    // Init Theme
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const isInitialDark = savedTheme === 'dark';
    if (isInitialDark) {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
    } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
    }
    updateThemeUI(isInitialDark);

    themeToggle?.addEventListener('click', toggleTheme);


    // --- Custom Searchable Dropdowns ---
    const initSearchableSelect = (wrapperId, selectId, nameLabelId) => {
        const wrapper = document.getElementById(wrapperId);
        const select = document.getElementById(selectId);
        if (!wrapper || !select) return null;

        const btn = wrapper.querySelector('.custom-select-btn');
        const menu = wrapper.querySelector('.dropdown-menu');
        const searchInput = wrapper.querySelector('.dropdown-search');
        const items = wrapper.querySelectorAll('.dropdown-item');
        const flagDisplay = wrapper.querySelector('.flag-display');
        const codeDisplay = wrapper.querySelector('.code-display');
        const nameLabel = document.getElementById(nameLabelId);

        const toggleMenu = (show) => {
            if (show) {
                // Close all other menus first
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== menu) {
                        m.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
                        m.classList.remove('scale-100', 'opacity-100');
                    }
                });
                menu.classList.remove('pointer-events-none', 'opacity-0', 'scale-95');
                menu.classList.add('scale-100', 'opacity-100');
                if (searchInput) {
                    searchInput.value = '';
                    filterItems('');
                    setTimeout(() => searchInput.focus(), 10);
                }
            } else {
                menu.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
                menu.classList.remove('scale-100', 'opacity-100');
            }
        };

        const filterItems = (query) => {
            const q = query.toLowerCase().trim();
            items.forEach(item => {
                const code = item.getAttribute('data-value').toLowerCase();
                const name = item.getAttribute('data-name').toLowerCase();
                const matches = code.includes(q) || name.includes(q);
                
                if (matches) {
                    item.classList.remove('hidden');
                    item.classList.add('flex');
                } else {
                    item.classList.add('hidden');
                    item.classList.remove('flex');
                }
            });
        };

        const updateDisplay = () => {
            const idx = select.selectedIndex;
            if (idx === -1) return;
            const selected = select.options[idx];

            const code = selected.value;
            const country = selected.getAttribute('data-country');
            const name = selected.getAttribute('data-name');

            if (flagDisplay && country) flagDisplay.src = `https://flagcdn.com/w40/${country}.png`;
            if (codeDisplay) codeDisplay.innerText = code;
            if (nameLabel) nameLabel.innerText = name;

            // Highlight selected in list
            items.forEach(item => {
                const isActive = item.getAttribute('data-value') === code;
                item.classList.toggle('bg-primary/10', isActive);
                item.classList.toggle('border-primary', isActive);
                item.classList.toggle('border-l-4', isActive);
            });
        };

        // Listeners
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShowing = !menu.classList.contains('opacity-0');
            toggleMenu(!isShowing);
        });

        searchInput?.addEventListener('input', (e) => filterItems(e.target.value));
        searchInput?.addEventListener('click', (e) => e.stopPropagation());

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = item.getAttribute('data-value');
                select.value = val;
                updateDisplay();
                toggleMenu(false);
                
                // Trigger change event if needed
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            });
        });

        // Init display
        updateDisplay();

        return { updateDisplay };
    };

    const fromControl = initSearchableSelect('from-wrapper', 'from_currency', 'from_currency_name_label');
    const toControl = initSearchableSelect('to-wrapper', 'to_currency', 'to_currency_name_label');

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                m.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
                m.classList.remove('scale-100', 'opacity-100');
            });
        }
    });


    // --- Swap Button Logic ---
    const swapBtn = document.getElementById('swap-btn');
    swapBtn?.addEventListener('click', (e) => {
        console.log('Swap button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const fromSelect = document.getElementById('from_currency');
        const toSelect = document.getElementById('to_currency');
        
        if (!fromSelect || !toSelect) {
            console.error('Select elements not found for swap');
            return;
        }

        const currentFrom = fromSelect.value;
        const currentTo = toSelect.value;
        
        fromSelect.value = currentTo;
        toSelect.value = currentFrom;

        if (fromControl) fromControl.updateDisplay();
        if (toControl) toControl.updateDisplay();

        // Animation
        const targets = [document.getElementById('target-value'), document.querySelector('input[name="amount"]')];
        targets.forEach(t => {
            if (t) {
                t.classList.add('opacity-30', 'scale-95');
                setTimeout(() => t.classList.remove('opacity-30', 'scale-95'), 150);
            }
        });
    });


    // --- Quick Access Buttons ---
    document.querySelectorAll('.quick-access-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const code = btn.getAttribute('data-code');
            const toSelect = document.getElementById('to_currency');
            if (toSelect) {
                toSelect.value = code;
                toControl.updateDisplay();
                // Optionally submit or just update
                document.getElementById('converter-form')?.submit();
            }
        });
    });


    // --- Mini Chart Initialization (Homepage Only) ---
    const initMiniChart = () => {
        const canvas = document.getElementById('miniPerformanceChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (window.myMiniChart) window.myMiniChart.destroy();

        const dataPoints = Array.from({length: 24}, () => Math.random() * 4 + 96);
        window.myMiniChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => i),
                datasets: [{
                    data: dataPoints,
                    borderColor: '#4f46e5',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 120);
                        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
                        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false, min: 90, max: 110 } }
            }
        });
        console.log('Mini performance chart initialized');
    };

    initMiniChart();


    // --- Form Feedback Loader ---
    const form = document.getElementById('converter-form');
    const submitBtn = document.getElementById('main-convert-btn');
    
    form?.addEventListener('submit', () => {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
            submitBtn.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                </div>
            `;
        }
    });
});
