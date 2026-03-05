// Clipboard utilities with toast feedback

let toastTimer = null;

export function showToast(message = 'Copied!') {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (!toast) return;

    toastText.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

export async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(message || 'Copied to clipboard!');
        return true;
    } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(message || 'Copied to clipboard!');
        return true;
    }
}

export async function copyHashtag(tag) {
    return copyToClipboard(tag, `${tag} copied!`);
}

export async function copyMultipleTags(tags) {
    const text = tags.join(' ');
    return copyToClipboard(text, `${tags.length} hashtags copied!`);
}
