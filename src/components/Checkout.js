import { loadStripe } from '@stripe/stripe-js';
import { db, auth, collection, doc, setDoc } from '../utils/firebase.js';
import {
    trackUpgradeModalShown,
    trackUpgradeClicked,
    trackUpgradeDismissed
} from '../lib/analytics/taglyAnalytics.js';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://taglyai.onrender.com/api';

let currentCurrency = 'INR';

export function initPricing() {
    const modal = document.getElementById('pricing-modal');
    const closeBtn = document.getElementById('pricing-modal-close');
    const subscribeBtn = document.getElementById('subscribe-btn');

    if (!modal) return;

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            modal.classList.add('visible');
            trackUpgradeModalShown('header_button', 0);
        });
    }

    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('visible');
        trackUpgradeDismissed(0);
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            trackUpgradeDismissed(0);
        }
    });

    // Handle currency toggling
    const toggles = document.querySelectorAll('.currency-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            // Update active state
            toggles.forEach(t => {
                t.classList.remove('active');
                t.style.background = 'var(--bg-elevated)';
                t.style.color = 'var(--text-primary)';
            });
            const clicked = e.currentTarget;
            clicked.classList.add('active');
            clicked.style.background = 'var(--accent)';
            clicked.style.color = 'white';

            currentCurrency = clicked.dataset.currency;

            // Update prices
            const priceDisplays = document.querySelectorAll('.price-display');
            priceDisplays.forEach(display => {
                const price = display.dataset[currentCurrency.toLowerCase()];
                if (currentCurrency === 'INR') {
                    display.textContent = `₹${price}/mo`;
                } else if (currentCurrency === 'AED') {
                    display.textContent = `AED ${price}/mo`;
                } else {
                    display.textContent = `$${price}/mo`;
                }
            });

            // Update button texts
            const upgradeBtns = document.querySelectorAll('.upgrade-btn');
            upgradeBtns.forEach(btn => {
                btn.textContent = currentCurrency === 'INR' ? 'Join Waitlist' : 'Upgrade';
            });
        });
    });

    // Handle Upgrade clicks
    const upgradeBtns = document.querySelectorAll('.upgrade-btn');
    upgradeBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const user = auth.currentUser;
            if (!user) {
                modal.classList.remove('visible');
                document.getElementById('auth-modal').classList.add('visible');
                return;
            }

            const tier = e.currentTarget.dataset.tier;
            trackUpgradeClicked(tier, 'modal');

            if (currentCurrency === 'INR') {
                await handleWaitlist(tier, user, e.currentTarget);
            } else {
                await handleCheckout(tier, user, e.currentTarget);
            }
        });
    });
}

async function handleWaitlist(tier, user, button) {
    const originalText = button.textContent;
    button.textContent = 'Joining...';
    try {
        await setDoc(doc(db, 'tagly_subscriptions', user.uid), {
            email: user.email,
            tierPreference: tier,
            status: 'waitlist',
            joinedAt: new Date().toISOString()
        });
        button.textContent = 'Waitlist Joined!';
        button.style.background = 'var(--success)';
        button.disabled = true;
    } catch (e) {
        console.error("Waitlist error:", e);
        button.textContent = originalText;
        alert("Could not join waitlist. Try again.");
    }
}

async function handleCheckout(tier, user, button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';

    try {
        const res = await fetch(`${API_BASE}/payments/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firebaseUid: user.uid,
                email: user.email,
                tier: tier,
                currency: currentCurrency
            }),
        });

        const data = await res.json();

        if (data.error) {
            console.error('Checkout error:', data.error);
            alert('Could not start checkout: ' + data.error);
            button.textContent = originalText;
            return;
        }

        if (data.url) {
            window.location.href = data.url;
        } else if (data.id) {
            const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            await stripe.redirectToCheckout({ sessionId: data.id });
        }
    } catch (err) {
        console.error('Checkout initiation failed:', err);
        alert('Payment system is currently unavailable. Please try again later.');
        button.textContent = originalText;
    }
}

// Keeping the old export name to limit diffs if it's imported elsewhere directly
export const handleSubscribeClick = (source = 'button') => {
    const modal = document.getElementById('pricing-modal');
    if (modal) {
        modal.classList.add('visible');
        trackUpgradeModalShown(typeof source === 'string' ? source : 'button', 0);
    }
};
