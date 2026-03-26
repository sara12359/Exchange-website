document.addEventListener('DOMContentLoaded', () => {
    // Theme Switcher Logic
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'light') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    // Custom Dropdown Logic
    const initCustomSelect = (selectId) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const wrapper = select.closest('.custom-select-wrapper');
        const customSelect = wrapper.querySelector('.custom-select');
        const optionsList = wrapper.querySelector('.select-options');
        const options = wrapper.querySelectorAll('.select-option');

        // Update custom display based on native select
        const updateDisplay = () => {
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) return;
            
            const country = selectedOption.getAttribute('data-country');
            const code = selectedOption.value;
            
            const flagImg = customSelect.querySelector('.flag-icon');
            if (flagImg) flagImg.src = `https://flagcdn.com/w40/${country}.png`;
            
            const codeSpan = customSelect.querySelector('.currency-code');
            if (codeSpan) codeSpan.textContent = code;
            
            // Update active state in list
            options.forEach(opt => {
                opt.classList.toggle('selected', opt.getAttribute('data-value') === code);
            });
        };

        // Initialize state
        updateDisplay();

        customSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(optionsList);
            optionsList.classList.toggle('show');
            customSelect.classList.toggle('active');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                select.value = value;
                updateDisplay();
                optionsList.classList.remove('show');
                customSelect.classList.remove('active');
            });
        });

        return { updateDisplay };
    };

    const closeAllDropdowns = (except) => {
        document.querySelectorAll('.select-options').forEach(list => {
            if (list !== except) {
                list.classList.remove('show');
                list.previousElementSibling.classList.remove('active');
            }
        });
    };

    document.addEventListener('click', () => closeAllDropdowns());

    initCustomSelect('from_currency');
    initCustomSelect('to_currency');

    // Currency Swap Logic
    const fromSelect = document.getElementById('from_currency');
    const toSelect = document.getElementById('to_currency');
    const converterForm = document.getElementById('converter-form');
    
    // Create a better swap button with modern styles
    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'swap-btn';
    swapBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="8 21 3 21 3 16"></polyline><line x1="3" y1="21" x2="20" y2="4"></line></svg>
    `;
    
    // Position it between the two selects
    const toGroup = toSelect.closest('.form-group');
    toGroup.before(swapBtn);

    swapBtn.addEventListener('click', () => {
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        
        // Sync custom displays by triggering updateDisplay logic
        // We can just call the init logic again or store the functions
        // But since we want to be clean, let's just trigger a change event if we had listeners
        // Or just manually call the update logic. Let's make the update logic accessible.
        
        const updateAll = () => {
            const selects = ['from_currency', 'to_currency'];
            selects.forEach(id => {
                const selectEl = document.getElementById(id);
                const wrapper = selectEl.closest('.custom-select-wrapper');
                const customSelect = wrapper.querySelector('.custom-select');
                const options = wrapper.querySelectorAll('.select-option');
                const selectedOption = selectEl.options[selectEl.selectedIndex];
                
                if (selectedOption) {
                    const country = selectedOption.getAttribute('data-country');
                    const code = selectedOption.value;
                    customSelect.querySelector('.flag-icon').src = `https://flagcdn.com/w40/${country}.png`;
                    customSelect.querySelector('.currency-code').textContent = code;
                    options.forEach(opt => {
                        opt.classList.toggle('selected', opt.getAttribute('data-value') === code);
                    });
                }
            });
        };

        updateAll();
        
        // Add rotation animation
        swapBtn.classList.add('rotating');
        setTimeout(() => {
            swapBtn.classList.remove('rotating');
        }, 400);
    });

    // Form submission state
    const convertBtn = document.querySelector('.convert-btn');
    if (converterForm && convertBtn) {
        converterForm.addEventListener('submit', () => {
            convertBtn.innerHTML = '<span class="loading">Processing...</span>';
            convertBtn.style.opacity = '0.7';
            convertBtn.style.pointerEvents = 'none';
        });
    }

    // Interactive button effects
    if (convertBtn) {
        convertBtn.addEventListener('mousedown', () => {
            convertBtn.style.transform = 'scale(0.98)';
        });
        convertBtn.addEventListener('mouseup', () => {
            convertBtn.style.transform = 'translateY(-2px)';
        });
    }
});
