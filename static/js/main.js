/**
 * Fiscal Architect 2.0 - Core Logic
 * Handles interactive components, theme switching, and data visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Controller ---
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const updateThemeUI = (isDark) => {
        themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    };

    const toggleTheme = () => {
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeUI(isDark);
    };

    // Init Theme
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedTheme === 'dark') {
        html.classList.add('dark');
        updateThemeUI(true);
    } else {
        html.classList.remove('dark');
        updateThemeUI(false);
    }

    themeToggle?.addEventListener('click', toggleTheme);


    // --- Custom Searchable Dropdowns ---
    const initSearchableSelect = (wrapperId, selectId, nameLabelId) => {
        const wrapper = document.getElementById(wrapperId);
        const select = document.getElementById(selectId);
        if (!wrapper || !select) return;

        const btn = wrapper.querySelector('.custom-select-btn');
        const menu = wrapper.querySelector('.dropdown-menu');
        const searchInput = wrapper.querySelector('.dropdown-search');
        const items = wrapper.querySelectorAll('.dropdown-item');
        const flagDisplay = wrapper.querySelector('.flag-display');
        const codeDisplay = wrapper.querySelector('.code-display');
        const nameLabel = document.getElementById(nameLabelId);

        const toggleMenu = (show) => {
            if (show) {
                menu.classList.remove('pointer-events-none', 'opacity-0', 'scale-95');
                menu.classList.add('scale-100', 'opacity-100');
                searchInput?.focus();
            } else {
                menu.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
                menu.classList.remove('scale-100', 'opacity-100');
                if (searchInput) searchInput.value = '';
                filterItems('');
            }
        };

        const filterItems = (query) => {
            const q = query.toLowerCase();
            items.forEach(item => {
                const code = item.getAttribute('data-value').toLowerCase();
                const name = item.getAttribute('data-name').toLowerCase();
                if (code.includes(q) || name.includes(q)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        };

        const updateDisplay = () => {
            const selected = select.options[select.selectedIndex];
            if (!selected) return;

            const code = selected.value;
            const country = selected.getAttribute('data-country');
            const name = selected.getAttribute('data-name');

            if (flagDisplay) flagDisplay.src = `https://flagcdn.com/w40/${country}.png`;
            if (codeDisplay) codeDisplay.textContent = code;
            if (nameLabel) nameLabel.textContent = name;

            // Highlight in list
            items.forEach(item => {
                const isActive = item.getAttribute('data-value') === code;
                item.classList.toggle('bg-primary/10', isActive);
                item.classList.toggle('border-primary', isActive);
            });
        };

        // Event Listeners
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShowing = !menu.classList.contains('opacity-0');
            // Close all first
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                m.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
                m.classList.remove('scale-100', 'opacity-100');
            });
            toggleMenu(!isShowing);
        });

        searchInput?.addEventListener('input', (e) => filterItems(e.target.value));

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = item.getAttribute('data-value');
                select.value = val;
                updateDisplay();
                toggleMenu(false);
            });
        });

        // Initialize display
        updateDisplay();

        return { updateDisplay };
    };

    const fromControl = initSearchableSelect('from-wrapper', 'from_currency', 'from_currency_name_label');
    const toControl = initSearchableSelect('to-wrapper', 'to_currency', 'to_currency_name_label');

    // Close on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => {
            m.classList.add('pointer-events-none', 'opacity-0', 'scale-95');
            m.classList.remove('scale-100', 'opacity-100');
        });
    });


    // --- Swap Button Logic ---
    const swapBtn = document.getElementById('swap-btn');
    swapBtn?.addEventListener('click', () => {
        const fromSelect = document.getElementById('from_currency');
        const toSelect = document.getElementById('to_currency');
        
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;

        fromControl.updateDisplay();
        toControl.updateDisplay();

        // Visual feedback for result update
        const targetValue = document.getElementById('target-value');
        if (targetValue) {
            targetValue.style.opacity = '0.3';
            setTimeout(() => targetValue.style.opacity = '1', 300);
        }
    });


    // --- Quick Access ---
    document.querySelectorAll('.quick-access-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-code');
            const toSelect = document.getElementById('to_currency');
            if (toSelect) {
                toSelect.value = code;
                toControl.updateDisplay();
                document.getElementById('converter-form')?.submit();
            }
        });
    });


    // --- Performance Chart ---
    const initChart = () => {
        const ctx = document.getElementById('miniPerformanceChart')?.getContext('2d');
        if (!ctx) return;

        // Generate semi-random data for visual appeal (simulating 24h)
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        const data = Array.from({length: 24}, () => Math.random() * 10 + 90);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Market Rate',
                    data: data,
                    borderColor: '#4f46e5',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
                        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
                        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    };

    initChart();


    // --- Submission Loader ---
    const form = document.getElementById('converter-form');
    const submitBtn = document.getElementById('main-convert-btn');
    
    form?.addEventListener('submit', () => {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <div class="flex items-center gap-3">
                    <svg class="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                </div>
            `;
        }
    });

    // Enter key support
    form?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            form.submit();
        }
    });
});
