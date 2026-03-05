// Search Bar Component – Enhanced for Magic Search

let debounceTimer = null;

export function initSearchBar(onSearch, onImageUpload) {
    const input = document.getElementById('search-input');
    const imageUpload = document.getElementById('image-upload');

    // Update placeholder for Magic Search
    if (input) {
        input.placeholder = 'Describe your content for AI hashtags...';

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();
            const wordCount = query.split(/\s+/).length;

            // Longer debounce for descriptive queries (Magic Search)
            const delay = wordCount >= 3 ? 800 : 300;

            debounceTimer = setTimeout(() => {
                onSearch(query);
            }, delay);
        });

        // Enter key — instant search
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
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
