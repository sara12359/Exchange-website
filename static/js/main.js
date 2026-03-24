document.addEventListener('DOMContentLoaded', () => {
        color: var(--text-secondary);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin: 0.5rem auto;
        transition: all 0.3s ease;
        font-size: 1.2rem;
    `;

    swapBtn.addEventListener('click', () => {
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        
        // Add rotation animation
        swapBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            swapBtn.style.transform = 'rotate(0deg)';
        }, 300);
    });

    swapBtn.addEventListener('mouseenter', () => {
        swapBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        swapBtn.style.color = 'var(--text-primary)';
    });

    swapBtn.addEventListener('mouseleave', () => {
        swapBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        swapBtn.style.color = 'var(--text-secondary)';
    });

    // Insert swap button between From and To selects
    const fromGroup = fromSelect.closest('.form-group');
    fromGroup.after(swapBtn);

    // Form submission animation
    const form = document.querySelector('form');
    const btn = document.querySelector('.convert-btn');

    form.addEventListener('submit', () => {
        btn.innerHTML = '<span class="loading">Converting...</span>';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
    });
});
