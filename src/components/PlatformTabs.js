// Platform Tabs Component

const PLATFORMS = [
    {
        id: 'youtube',
        name: 'YouTube',
        color: '#FF0000',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 6.186a2.599 2.599 0 0 0-1.824-1.838C18.146 3.9 12 3.9 12 3.9s-6.146 0-7.758.448a2.599 2.599 0 0 0-1.824 1.838C2 7.798 2 12 2 12s0 4.202.418 5.814a2.599 2.599 0 0 0 1.824 1.838C5.854 20.1 12 20.1 12 20.1s6.146 0 7.758-.448a2.599 2.599 0 0 0 1.824-1.838C22 16.202 22 12 22 12s0-4.202-.418-5.814zM9.99 15.293V8.707L15.694 12l-5.704 3.293z"/></svg>'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        color: '#E1306C',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z"/></svg>'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        color: '#1877F2',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        color: '#ffffff',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>'
    },
    {
        id: 'threads',
        name: 'Threads',
        color: '#ffffff',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1.84 4.09A6 6 0 1 1 14.6 6.3l.08.03A12.56 12.56 0 0 0 12 6a9 9 0 1 0 9 9v-1a5.62 5.62 0 0 0-5.63-5.63A4 4 0 0 0 8 12.5a4 4 0 0 0 5.82 3.56A3.6 3.6 0 0 1 19 14v1a7 7 0 1 1-1.16-3.91Z"/></svg>'
    },
    {
        id: 'x',
        name: 'X',
        color: '#ffffff',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>'
    },
    {
        id: 'pinterest',
        name: 'Pinterest',
        color: '#E60023',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z"/></svg>'
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        color: '#0A66C2',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    },
    {
        id: 'snapchat',
        name: 'Snapchat',
        color: '#FFFC00',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.115 23.633c-1.428 0-2.613-.393-3.52-.777-.386-.164-.702-.298-.823-.298-.109 0-.251.059-.806.27-.406.155-.89.336-1.411.385a4.032 4.032 0 0 1-.947-.042c-.521-.09-.96-.282-1.334-.582a2.316 2.316 0 0 1-.806-1.31c-.084-.336-.051-.629.102-.914a2.238 2.238 0 0 1 .477-.61c.148-.12.428-.316.719-.516.486-.334.697-.478.714-.626.014-.14-.184-.336-.505-.536-1.554-.972-2.585-2.029-3.064-3.14-.302-.7-.34-1.311-.088-1.637.585-.758 2.292-.72 2.775-.668.618.066.866.27.973.535.1.25.1.58.118 1.053l.035.801c.074 1.706 1.487 2.923 1.838 3.195.034.025.075.025.109 0v-.008c.033-.025.05-.084.05-.143 0-.025-1.996-10.435-1.996-12.029C4.717 1.897 8.01 0 11.964 0c3.962 0 7.255 1.897 7.255 5.541 0 1.593-1.996 12.004-1.996 12.029 0 .058.017.117.05.143v.008c.034.025.075.025.109 0 .351-.272 1.764-1.489 1.838-3.195l.034-.8c.017-.474.017-.803.118-1.053.1-.265.355-.47.973-.535.483-.052 2.19-.09 2.775.668.252.326.214.937-.088 1.637-.479 1.111-1.51 2.168-3.064 3.14-.321.2-.52.396-.505.536.017.149.228.293.714.626.291.2.571.396.719.516a2.235 2.235 0 0 1 .477.61 1.734 1.734 0 0 1 .102.914 2.308 2.308 0 0 1-.806 1.31c-.373.3-.812.492-1.333.582a3.999 3.999 0 0 1-.947.042c-.521-.05-1.005-.23-1.411-.385-.555-.211-.697-.27-.806-.27-.121 0-.437.134-.823.298a8.337 8.337 0 0 1-3.52.777zm.151-5.692h-.302c-1.123 0-3.32-.473-4.662-1.637-.16-.14-.243-.306-.243-.464 0-.306.314-.492.65-.434l.033.008c2.194.39 3.518.732 4.072.732h.301c.554 0 1.878-.337 4.072-.732l.034-.008c.335-.058.65.128.65.434 0 .158-.083.324-.243.464-1.341 1.164-3.539 1.637-4.662 1.637z"/></svg>'
    },
];

let scrollInterval = null;

export function renderPlatformTabs(container, activePlatform, onSelect) {
    container.innerHTML = '';

    // Create the wrapper for scroll areas
    const wrapper = document.createElement('div');
    wrapper.className = 'platform-tabs-wrapper';

    // The actual scrollable container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'platform-tabs';

    // Left hover area
    const leftHover = document.createElement('div');
    leftHover.className = 'scroll-hover-area scroll-left';
    leftHover.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';

    // Right hover area
    const rightHover = document.createElement('div');
    rightHover.className = 'scroll-hover-area scroll-right';
    rightHover.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

    // Set up hover scrolling
    const startScroll = (direction) => {
        if (scrollInterval) clearInterval(scrollInterval);
        scrollInterval = setInterval(() => {
            scrollContainer.scrollBy({ left: direction * 5, behavior: 'auto' });
            updateHoverVisibility();
        }, 16);
    };

    const stopScroll = () => {
        if (scrollInterval) clearInterval(scrollInterval);
    };

    leftHover.addEventListener('mouseenter', () => startScroll(-1));
    leftHover.addEventListener('mouseleave', stopScroll);
    rightHover.addEventListener('mouseenter', () => startScroll(1));
    rightHover.addEventListener('mouseleave', stopScroll);

    // Touch support
    leftHover.addEventListener('touchstart', (e) => { e.preventDefault(); startScroll(-1); });
    leftHover.addEventListener('touchend', stopScroll);
    rightHover.addEventListener('touchstart', (e) => { e.preventDefault(); startScroll(1); });
    rightHover.addEventListener('touchend', stopScroll);

    // Update visibility of hover arrows based on scroll position
    const updateHoverVisibility = () => {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
        leftHover.style.opacity = scrollLeft > 5 ? '1' : '0';
        leftHover.style.pointerEvents = scrollLeft > 5 ? 'auto' : 'none';

        const maxScroll = scrollWidth - clientWidth;
        rightHover.style.opacity = scrollLeft < maxScroll - 5 ? '1' : '0';
        rightHover.style.pointerEvents = scrollLeft < maxScroll - 5 ? 'auto' : 'none';
    };

    scrollContainer.addEventListener('scroll', updateHoverVisibility, { passive: true });

    // Render tabs
    PLATFORMS.forEach((platform) => {
        const tab = document.createElement('button');
        tab.className = `platform-tab${platform.id === activePlatform ? ' active' : ''}`;
        tab.setAttribute('data-platform', platform.id);

        // Platforms that have near-white brand backgrounds need dark text
        const needsDarkText = ['snapchat', 'tiktok', 'threads', 'x'].includes(platform.id);

        // Define active style based on brand color
        if (platform.id === activePlatform) {
            tab.style.backgroundColor = platform.color;
            tab.style.borderColor = platform.color;
            tab.style.boxShadow = `0 0 16px ${platform.color}40`;

            if (needsDarkText) {
                tab.style.color = '#000000';
            }
        }

        tab.innerHTML = `
      <span class="platform-tab-icon" style="color: ${platform.id !== activePlatform ? platform.color : (needsDarkText ? '#000000' : '#ffffff')}">${platform.icon}</span>
      <span>${platform.name}</span>
    `;

        tab.addEventListener('click', () => {
            // Reset all styles
            scrollContainer.querySelectorAll('.platform-tab').forEach(t => {
                t.classList.remove('active');
                t.style.backgroundColor = '';
                t.style.borderColor = '';
                t.style.boxShadow = '';
                t.style.color = '';
                const icon = t.querySelector('.platform-tab-icon');
                const pColor = PLATFORMS.find(p => p.id === t.getAttribute('data-platform'))?.color || '#fff';
                icon.style.color = pColor;
            });

            // Apply active styles
            tab.classList.add('active');
            tab.style.backgroundColor = platform.color;
            tab.style.borderColor = platform.color;
            tab.style.boxShadow = `0 0 16px ${platform.color}40`;

            if (needsDarkText) {
                tab.style.color = '#000000';
                tab.querySelector('.platform-tab-icon').style.color = '#000000';
            } else {
                tab.querySelector('.platform-tab-icon').style.color = '#ffffff';
            }

            onSelect(platform.id);

            // Scroll into view
            tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });

        scrollContainer.appendChild(tab);
    });

    wrapper.appendChild(leftHover);
    wrapper.appendChild(scrollContainer);
    wrapper.appendChild(rightHover);

    container.appendChild(wrapper);

    // Initial check for arrows
    setTimeout(updateHoverVisibility, 100);
    window.addEventListener('resize', updateHoverVisibility);
}

export function getPlatforms() {
    return PLATFORMS;
}
