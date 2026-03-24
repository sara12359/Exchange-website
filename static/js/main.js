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

    // Currency Swap Logic
    const fromSelect = document.getElementById('from_currency');
    const toSelect = document.getElementById('to_currency');
    const form = document.querySelector('form');
    
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
        
        // Add rotation animation
        swapBtn.classList.add('rotating');
        setTimeout(() => {
            swapBtn.classList.remove('rotating');
        }, 400);
    });

    // Form submission state
    const convertBtn = document.querySelector('.convert-btn');
    if (form && convertBtn) {
        form.addEventListener('submit', () => {
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
