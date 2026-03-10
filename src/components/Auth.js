import {
    auth, db, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signInWithPopup, onAuthStateChanged, signOut, sendEmailVerification, RecaptchaVerifier,
    signInWithPhoneNumber, doc, setDoc, getDoc, updateDoc, updatePassword,
    collection, query, where, orderBy, limit, getDocs, startAfter
} from '../utils/firebase.js';
import { onSnapshot } from 'firebase/firestore';
import { handleSubscribeClick } from './Checkout.js';

let isRegisterMode = true;
export let currentUser = null;
export let currentUserProfile = null;

let profileUnsubscribe = null;

export function initAuth(onProfileUpdate) {
    const authModal = document.getElementById('auth-modal');
    const authModalClose = document.getElementById('auth-modal-close');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authGoogleBtn = document.getElementById('auth-google-btn');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const proBtn = document.getElementById('pro-btn');
    const userBtn = document.getElementById('user-btn');
    const subscribeBtn = document.getElementById('subscribe-btn');

    // Make sure we listen to auth state changes to update the header UI
    onAuthStateChanged(auth, async (user) => {
        if (profileUnsubscribe) {
            profileUnsubscribe();
            profileUnsubscribe = null;
        }

        if (user) {
            currentUser = user;
            // Check if user exists in Firestore
            try {
                const userRef = doc(db, 'tagly_users', user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        email: user.email || '',
                        displayName: user.displayName || user.phoneNumber || 'Creator',
                        photoURL: user.photoURL || '',
                        createdAt: new Date().toISOString(),
                        subscriptionTier: 'spark',
                        searchesUsedThisMonth: 0,
                        launchMode: true
                    });
                }

                profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        currentUserProfile = docSnap.data();
                        if (onProfileUpdate) onProfileUpdate(currentUserProfile);
                    }
                });

            } catch (err) {
                console.error("Failed to sync user data:", err);
            }

            proBtn.style.display = 'none';
            userBtn.style.display = 'block';
            userBtn.textContent = 'Account';
            if (subscribeBtn) subscribeBtn.style.display = 'flex';
            authModal.classList.remove('visible');

            // Check if user is locked out due to the blur
            const premiumOverlay = document.getElementById('premium-lock-overlay');
            if (premiumOverlay) {
                premiumOverlay.classList.remove('visible');
                const premiumContent = document.getElementById('premium-ideas-content');
                if (premiumContent) premiumContent.classList.remove('blurred');
            }
        } else {
            currentUser = null;
            currentUserProfile = null;
            if (onProfileUpdate) onProfileUpdate(null);

            proBtn.style.display = 'block';
            userBtn.style.display = 'none';
            if (subscribeBtn) subscribeBtn.style.display = 'none';
        }
    });

    proBtn?.addEventListener('click', () => {
        authModal.classList.add('visible');
    });

    subscribeBtn?.addEventListener('click', handleSubscribeClick);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('lock-btn') || e.target.closest('.lock-btn')) {
            authModal.classList.add('visible');
        }
    });

    const profileModal = document.getElementById('profile-modal');

    let currentHistoryDoc = null;
    const HISTORY_LIMIT = 5;

    async function loadSearchHistory(isNextPage = false) {
        const historyList = document.getElementById('profile-history-list');
        const upgradeMsg = document.getElementById('profile-history-upgrade');
        const nextBtnContainer = document.getElementById('profile-history-pagination');
        const tier = currentUserProfile?.subscriptionTier || 'spark';

        if (!isNextPage) {
            historyList.innerHTML = '<em style="color:var(--text-secondary)">Loading history...</em>';
            currentHistoryDoc = null;
        }

        try {
            // Simple query with NO orderBy to avoid composite index requirement.
            // We sort in memory below.
            let q = query(
                collection(db, 'tagly_searches'),
                where('userId', '==', currentUser.uid),
                limit(20)
            );

            const snapshot = await getDocs(q);

            if (!isNextPage) historyList.innerHTML = '';

            if (snapshot.empty && !isNextPage) {
                historyList.innerHTML = '<em style="color:var(--text-secondary)">No searches yet. Start searching!</em>';
                upgradeMsg.style.display = 'none';
                nextBtnContainer.style.display = 'none';
                return;
            }

            // Sort in memory by timestamp desc
            const docs = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, HISTORY_LIMIT);

            docs.forEach(data => {
                const d = new Date(data.timestamp);
                const isMagic = !!data.isMagic;
                const item = document.createElement('div');
                item.style.cssText = 'padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.2s;';
                item.onmouseover = () => { item.style.borderColor = 'var(--accent-light)'; };
                item.onmouseout = () => { item.style.borderColor = 'var(--border-color)'; };

                const magicBadge = isMagic ? '<span style="font-size:9px; background:rgba(139,92,246,0.2); color:#a78bfa; border:1px solid rgba(139,92,246,0.3); border-radius:8px; padding:1px 6px; font-weight:700;">MAGIC</span>' : '';
                const replayHint = (isMagic && data.categories) ? '<div style="font-size:10px; color:var(--accent-light); margin-top:4px;">&larr; Click to reload full AI results</div>' : '';

                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                        <strong style="color:var(--text-primary); font-size:13px;">${isMagic ? '🔮' : '🔍'} ${data.query || 'Auto Generated'}</strong>
                        <div style="display:flex; gap:6px; align-items:center;">${magicBadge}<span style="font-size:10px; color:var(--text-secondary);">${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                    </div>
                    <div style="font-size:11px; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        📱 ${data.platform || ''} ${data.results ? '· ' + data.results.slice(0, 3).join(', ') : ''}
                    </div>
                    ${replayHint}
                `;

                item.addEventListener('click', () => {
                    if (isMagic && data.categories && window._taglyReplayMagicResult && window._taglyReplayMagicResult(data)) {
                        profileModal.classList.remove('visible');
                        return;
                    }
                    profileModal.classList.remove('visible');
                    const searchInput = document.getElementById('search-input');
                    if (searchInput && data.query) {
                        searchInput.value = data.query;
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });

                historyList.appendChild(item);
            }); // end forEach

            if (tier === 'spark' && snapshot.docs.length >= 20) {
                upgradeMsg.style.display = 'block';
                nextBtnContainer.style.display = 'none';
            } else {
                upgradeMsg.style.display = 'none';
                nextBtnContainer.style.display = 'none';
            }

        } catch (e) {
            console.error('Failed to load search history:', e);
            historyList.innerHTML = '<em style="color:var(--text-secondary)">History temporarily unavailable.</em>';
        }
    } // end loadSearchHistory

    userBtn?.addEventListener('click', () => {
        if (profileModal) {
            const input = document.getElementById('profile-name');
            if (input && currentUserProfile) {
                input.value = currentUserProfile.displayName || '';
            }

            const tier = currentUserProfile?.subscriptionTier || 'spark';
            const limits = { spark: 10, creator: 100, growth: 500, agency: Infinity };
            const tierColors = { spark: '#9ca3af', creator: '#22c55e', growth: '#3b82f6', agency: '#a855f7' };
            const tierLabels = { spark: 'Trial', creator: '⭐ Creator', growth: '🚀 Growth', agency: '🏢 Agency' };
            const maxLimit = limits[tier] ?? 10;
            const used = currentUserProfile?.searchesUsedThisMonth || 0;
            const displayLimit = maxLimit === Infinity ? '∞' : maxLimit;
            const tierColor = tierColors[tier] || '#9ca3af';
            const tierLabel = tierLabels[tier] || 'Trial';

            document.getElementById('profile-desc').innerHTML = `
                <span style="display:inline-block; padding:3px 10px; border-radius:12px; background:${tierColor}20; color:${tierColor}; border:1px solid ${tierColor}40; font-size:11px; font-weight:700; margin-bottom:6px;">${tierLabel} Plan</span><br>
                <span style="color:var(--text-secondary); font-size:12px;">Searches used this month: <strong style="color:var(--text-primary)">${used}/${displayLimit}</strong></span>
            `;
            document.getElementById('profile-password-msg').style.display = 'none';
            document.getElementById('profile-new-password').value = '';
            const currPw = document.getElementById('profile-current-password');
            if (currPw) currPw.value = '';

            loadSearchHistory();

            profileModal.classList.add('visible');
        }
    });

    document.getElementById('profile-history-next-btn')?.addEventListener('click', () => {
        loadSearchHistory(true);
    });

    document.getElementById('profile-password-btn')?.addEventListener('click', async (e) => {
        const passInput = document.getElementById('profile-new-password');
        const currentPassInput = document.getElementById('profile-current-password');
        const msg = document.getElementById('profile-password-msg');
        const newPass = passInput.value;
        const currentPass = currentPassInput ? currentPassInput.value : '';
        const btn = e.currentTarget;

        if (!currentPass) {
            msg.textContent = 'Please enter your current password.';
            msg.style.display = 'block';
            return;
        }

        if (newPass.length < 6) {
            msg.textContent = 'Password must be at least 6 characters.';
            msg.style.display = 'block';
            return;
        }

        btn.textContent = 'Updating...';
        msg.style.display = 'none';

        try {
            // Re-authenticate first
            const { EmailAuthProvider, reauthenticateWithCredential } = await import('../utils/firebase.js');
            const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
            await reauthenticateWithCredential(currentUser, credential);

            await updatePassword(currentUser, newPass);
            btn.textContent = 'Password updated! ✓';
            passInput.value = '';
            if (currentPassInput) currentPassInput.value = '';
            setTimeout(() => btn.textContent = 'Change Password', 3000);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg.textContent = 'Current password is incorrect. Try again.';
            } else {
                msg.textContent = err.message || 'Failed to update password.';
            }
            msg.style.display = 'block';
            btn.textContent = 'Change Password';
        }
    });

    document.getElementById('profile-modal-close')?.addEventListener('click', () => {
        profileModal.classList.remove('visible');
    });

    document.getElementById('profile-signout-btn')?.addEventListener('click', async () => {
        await signOut(auth);
        profileModal.classList.remove('visible');
    });

    document.getElementById('profile-save-btn')?.addEventListener('click', async (e) => {
        if (!currentUser) return;
        const newName = document.getElementById('profile-name').value.trim();
        const btn = e.currentTarget;
        btn.textContent = 'Saving...';
        let success = false;
        try {
            await updateDoc(doc(db, 'tagly_users', currentUser.uid), { displayName: newName });
            try {
                // Ensure users collection is also synced per request
                await updateDoc(doc(db, 'users', currentUser.uid), { displayName: newName });
            } catch (err) { }
            success = true;
        } catch (err) {
            console.error(err);
        } finally {
            // setIsSaving(false) equivalent inside finally block to guarantee release
            btn.textContent = success ? 'Name saved! ✓' : 'Failed';
            setTimeout(() => {
                btn.textContent = 'Update Name';
            }, 2000);
        }
    });

    authModalClose?.addEventListener('click', () => {
        authModal.classList.remove('visible');
    });

    // Close on overlay click
    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('visible');
        }
    });

    // Setup Tabs
    const tabEmail = document.getElementById('tab-email');
    const tabPhone = document.getElementById('tab-phone');
    const emailForm = document.getElementById('auth-form');
    const phoneForm = document.getElementById('auth-phone-form');

    tabEmail?.addEventListener('click', () => {
        tabEmail.style.background = 'var(--accent-light)';
        tabPhone.style.background = 'var(--bg-secondary)';
        emailForm.style.display = 'block';
        phoneForm.style.display = 'none';
    });

    tabPhone?.addEventListener('click', () => {
        tabPhone.style.background = 'var(--accent-light)';
        tabEmail.style.background = 'var(--bg-secondary)';
        phoneForm.style.display = 'block';
        emailForm.style.display = 'none';

        // Use invisible reCAPTCHA attached to a static div
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-invisible', {
                'size': 'invisible',
                'callback': (response) => {
                    console.log('✅ reCAPTCHA solved automatically');
                }
            });
        }

        // Initialize intl-tel-input if not already done
        const phoneInput = document.querySelector("#auth-phone-number");
        if (phoneInput && !window.intlPhoneInput) {
            window.intlPhoneInput = window.intlTelInput(phoneInput, {
                initialCountry: "auto",
                geoIpLookup: function (callback) {
                    fetch("https://ipapi.co/json")
                        .then(function (res) { return res.json(); })
                        .then(function (data) { callback(data.country_code); })
                        .catch(function () { callback("us"); });
                },
                utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
                separateDialCode: true,
                countrySearch: true
            });
        }
    });

    authSwitchLink?.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        const title = document.getElementById('auth-title');
        const prompt = document.getElementById('auth-prompt');

        if (isRegisterMode) {
            title.textContent = 'Create Account';
            authSubmitBtn.textContent = 'Register with Email';
            prompt.textContent = 'Already have an account?';
            authSwitchLink.textContent = 'Login';
        } else {
            title.textContent = 'Welcome Back';
            authSubmitBtn.textContent = 'Login with Email';
            prompt.textContent = 'Need an account?';
            authSwitchLink.textContent = 'Register';
        }
    });

    // Email/Password Submit
    authSubmitBtn?.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        const errorMsg = document.getElementById('auth-error-msg');
        errorMsg.style.display = 'none';

        if (!email || !password) {
            errorMsg.textContent = 'Email and password are required.';
            errorMsg.style.display = 'block';
            return;
        }

        try {
            if (isRegisterMode) {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(cred.user);
                alert("Account created. Please verify your email.");
            } else {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                if (!cred.user.emailVerified) {
                    alert("Please verify your email address.");
                }
            }
        } catch (error) {
            console.error("Auth Error:", error);
            errorMsg.textContent = error.message.replace('Firebase: ', '');
            errorMsg.style.display = 'block';
        }
    });

    // Google Sign In
    authGoogleBtn?.addEventListener('click', async () => {
        const errorMsg = document.getElementById('auth-error-msg');
        errorMsg.style.display = 'none';
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google Auth Error:", error);
            errorMsg.textContent = error.message.replace('Firebase: ', '');
            errorMsg.style.display = 'block';
        }
    });

    // Phone Auth
    const phoneSendCodeBtn = document.getElementById('auth-send-code-btn');
    const phoneVerifyBtn = document.getElementById('auth-verify-code-btn');
    const phoneStep1 = document.getElementById('phone-step-1');
    const phoneStep2 = document.getElementById('phone-step-2');
    const resendBtn = document.getElementById('auth-resend-btn');
    const changeNumberBtn = document.getElementById('auth-change-number-btn');

    let resendTimer = null;
    let resendCountdown = 30;

    function startResendTimer() {
        if (!resendBtn) return;
        resendCountdown = 30;
        resendBtn.disabled = true;
        resendBtn.style.color = 'var(--text-secondary)';

        clearInterval(resendTimer);
        resendTimer = setInterval(() => {
            resendCountdown--;
            if (resendCountdown <= 0) {
                clearInterval(resendTimer);
                resendBtn.textContent = 'Resend OTP';
                resendBtn.disabled = false;
                resendBtn.style.color = 'var(--accent-light)';
            } else {
                resendBtn.textContent = `Resend in ${resendCountdown}s`;
            }
        }, 1000);
    }

    async function handleSendOTP(btnElement) {
        // Get phone number - try intlPhoneInput first, fallback to raw input
        let phone = '';
        if (window.intlPhoneInput) {
            phone = window.intlPhoneInput.getNumber();
            console.log('📞 intl-tel-input number:', phone);
        } else {
            phone = document.getElementById('auth-phone-number')?.value?.trim() || '';
            console.log('📞 Raw input number:', phone);
        }

        if (!phone) {
            alert('Please enter a valid phone number.');
            return;
        }

        // Show loading state
        const originalText = btnElement.textContent;
        btnElement.textContent = 'Sending OTP...';
        btnElement.disabled = true;

        try {
            if (!window.recaptchaVerifier) {
                alert('reCAPTCHA not loaded. Please refresh the page and try again.');
                btnElement.textContent = originalText;
                btnElement.disabled = false;
                return;
            }

            console.log('📞 Calling signInWithPhoneNumber with:', phone);
            const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
            console.log('✅ OTP sent successfully');
            window.confirmationResult = confirmationResult;
            phoneStep1.style.display = 'none';
            phoneStep2.style.display = 'block';
            document.getElementById('auth-title').textContent = "Enter OTP";
            startResendTimer();
        } catch (error) {
            console.error("📞 SMS Error:", error.code, error.message);

            let userMsg = 'Failed to send OTP. ';
            if (error.code === 'auth/invalid-phone-number') {
                userMsg += 'Invalid phone number format.';
            } else if (error.code === 'auth/too-many-requests') {
                userMsg += 'Too many attempts. Please wait and try again later.';
            } else if (error.code === 'auth/captcha-check-failed') {
                userMsg += 'reCAPTCHA verification failed. Please try again.';
            } else if (error.code === 'auth/operation-not-allowed') {
                userMsg += 'Phone authentication is not enabled. Please contact support.';
            } else if (error.code === 'auth/invalid-app-credential') {
                userMsg += 'App credentials invalid. Either the reCAPTCHA token mismatch, or domain is unauthorised. Make sure to use billing-enabled account for non-demo numbers.';
            } else {
                userMsg += error.message || 'Unknown error occurred.';
            }

            alert(userMsg);

            // Reset Recaptcha for retry
            try {
                if (window.recaptchaVerifier) {
                    const widgetId = await window.recaptchaVerifier.render();
                    if (window.grecaptcha) window.grecaptcha.reset(widgetId);
                }
            } catch (resetErr) {
                console.warn('Could not reset reCAPTCHA, recreating...', resetErr);
                // Safely recreate verifier
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-invisible', {
                    'size': 'invisible',
                    'callback': () => console.log('✅ reCAPTCHA solved')
                });
            }

            // Re-throw so callers can react (like not going to step 2)
            throw error;
        } finally {
            if (btnElement.textContent === 'Sending OTP...') { // if unchanged
                btnElement.textContent = originalText;
            }
            btnElement.disabled = false;
        }
    }

    phoneSendCodeBtn?.addEventListener('click', async () => {
        try {
            await handleSendOTP(phoneSendCodeBtn);
        } catch (e) {
            // Error managed in handleSendOTP
            console.log('OTP sending failed');
        }
    });

    resendBtn?.addEventListener('click', async () => {
        try {
            await handleSendOTP(resendBtn);
        } catch (e) {
            // Error managed in handleSendOTP
            console.log('OTP resending failed');
        }
    });

    changeNumberBtn?.addEventListener('click', () => {
        clearInterval(resendTimer);
        phoneStep1.style.display = 'block';
        phoneStep2.style.display = 'none';
        document.getElementById('auth-title').textContent = isRegisterMode ? "Create Account" : "Welcome Back";
    });

    phoneVerifyBtn?.addEventListener('click', async () => {
        const code = document.getElementById('auth-sms-code').value.trim();
        if (!code) return;
        phoneVerifyBtn.textContent = 'Verifying...';
        phoneVerifyBtn.disabled = true;
        try {
            await window.confirmationResult.confirm(code);
            // onAuthStateChanged handles success
        } catch (error) {
            console.error("SMS Verify Error", error);
            alert("Invalid OTP code. Please try again.");
            phoneVerifyBtn.textContent = 'Verify OTP';
            phoneVerifyBtn.disabled = false;
        }
    });
}
