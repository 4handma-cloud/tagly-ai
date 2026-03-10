import { db, collection, getDocs } from './utils/firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Restrict access to localhost/127.0.0.1
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        document.body.innerHTML = '<h2 style="color:var(--hot-color); text-align:center; padding: 50px;">Access Denied. Localhost Only.</h2>';
        return;
    }

    const loginBtn = document.getElementById('admin-login-btn');
    const pwdInput = document.getElementById('admin-pwd');
    const loginDiv = document.getElementById('admin-login');
    const contentDiv = document.getElementById('admin-content');
    const errorMsg = document.getElementById('admin-error');

    loginBtn.addEventListener('click', async () => {
        const pwd = pwdInput.value;
        if (pwd === '2012fayekrana') { // admin credentials
            loginDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            await loadUsers();
        } else {
            errorMsg.style.display = 'block';
        }
    });

    pwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });
});

async function loadUsers() {
    const tbody = document.getElementById('admin-tbody');
    const totalUsers = document.getElementById('total-users');
    const pwdInput = document.getElementById('admin-pwd');
    const password = pwdInput.value;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">Loading...</td></tr>';

    try {
        const url = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001/api/admin/users'
            : 'https://taglyai.onrender.com/api/admin/users';

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${password}` }
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();

        let html = '';
        let count = 0;

        if (data.mock) {
            html += `<tr><td colspan="6" style="text-align:center; color:var(--accent); font-size: 13px;">⚠️ Rendering Mock Data (Backend Firebase Admin uninitialized locally)</td></tr>`;
        }

        data.users.forEach(user => {
            count++;
            const date = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
            const launchMode = user.launchMode ? '<span style="color:var(--success)">ON</span>' : '<span style="color:var(--text-tertiary)">OFF</span>';
            const tierColor = user.subscriptionTier === 'agency' ? '#a855f7' :
                user.subscriptionTier === 'growth' ? '#3b82f6' :
                    user.subscriptionTier === 'creator' ? '#22c55e' : 'white';

            html += `
                <tr>
                    <td>${user.email || 'No Email'}</td>
                    <td>${user.displayName || 'Unnamed'}</td>
                    <td style="color:${tierColor}; font-weight:600; text-transform:uppercase;">${user.subscriptionTier || 'spark'}</td>
                    <td>${user.searchesUsedThisMonth || 0}</td>
                    <td>${launchMode}</td>
                    <td>${date}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        totalUsers.textContent = count;

    } catch (e) {
        console.error("Error loading users:", e);
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--hot-color);">Failed to load users: ${e.message}</td></tr>`;
    }
}
