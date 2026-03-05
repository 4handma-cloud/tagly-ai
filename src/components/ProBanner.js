// Pro Banner Component – Monetization placeholder

export function initProBanner() {
    const proBtn = document.getElementById('pro-btn');
    const proModal = document.getElementById('pro-modal');
    const modalClose = document.getElementById('modal-close');

    if (!proBtn || !proModal) return;

    proBtn.addEventListener('click', () => {
        proModal.classList.add('visible');
    });

    modalClose?.addEventListener('click', () => {
        proModal.classList.remove('visible');
    });

    proModal.addEventListener('click', (e) => {
        if (e.target === proModal) {
            proModal.classList.remove('visible');
        }
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            proModal.classList.remove('visible');
        }
    });
}
