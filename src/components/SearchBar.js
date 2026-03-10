// Search Bar Component – Enhanced for Magic Search

let debounceTimer = null;

export function initSearchBar(onSearch, onImageUpload) {
    const input = document.getElementById('search-input');
    const imageUpload = document.getElementById('image-upload');
    const generateBtn = document.getElementById('generate-btn');
    const platformDropdown = document.getElementById('search-platform-dropdown');

    // Update placeholder for Magic Search
    if (input) {
        input.placeholder = 'Keyword or topic...';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
                onSearch(input.value.trim());
            }
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            clearTimeout(debounceTimer);
            if (input) onSearch(input.value.trim());
        });
    }

    if (platformDropdown) {
        platformDropdown.addEventListener('change', () => {
            // Optionally trigger search immediately on platform change
            if (input && input.value.trim()) {
                onSearch(input.value.trim());
            }
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                onImageUpload(file);
                e.target.value = '';
            }
        });
    }
}

export function clearSearch() {
    const input = document.getElementById('search-input');
    if (input) input.value = '';
}
