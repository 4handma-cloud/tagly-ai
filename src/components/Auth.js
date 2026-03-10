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
            historyList.innerHTML = 'Loading...';
            currentHistoryDoc = null;
        }

        try {
            let q = query(
                collection(db, 'tagly_searches'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(HISTORY_LIMIT)
            );

            if (isNextPage && currentHistoryDoc && tier !== 'spark') {
                q = query(
                    collection(db, 'tagly_searches'),
                    where('userId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc'),
                    startAfter(currentHistoryDoc),
                    limit(HISTORY_LIMIT)
                );
            }

            const snapshot = await getDocs(q);

            if (!isNextPage) historyList.innerHTML = '';

            if (snapshot.empty && !isNextPage) {
                historyList.innerHTML = 'No recent searches.';
                upgradeMsg.style.display = 'none';
                nextBtnContainer.style.display = 'none';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const d = new Date(data.timestamp);
                const item = document.createElement('div');
                item.style.cssText = 'padding: 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px;';
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                        <strong style="color:var(--text-primary);">${data.query || 'Auto Generated'}</strong>
                        <span style="font-size:10px;">${d.toLocaleDateString()}</span>
                    </div>
                    <div style="font-size:11px; display:flex; gap: 4px; overflow-x:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${data.results ? data.results.slice(0, 4).join(', ') : ''}
                    </div>
                `;
                historyList.appendChild(item);
            });

            currentHistoryDoc = snapshot.docs[snapshot.docs.length - 1];

            if (snapshot.docs.length === HISTORY_LIMIT) {
                if (tier === 'spark') {
                    upgradeMsg.style.display = 'block';
                    nextBtnContainer.style.display = 'none';
                } else {
                    upgradeMsg.style.display = 'none';
                    nextBtnContainer.style.display = 'block';
                }
            } else {
                upgradeMsg.style.display = 'none';
                nextBtnContainer.style.display = 'none';
            }

        } catch (e) {
            console.error("Failed to load search history:", e);
            historyList.innerHTML = 'Failed to load history due to Firestore index requirements. (Check console)';
        }
    }

    userBtn?.addEventListener('click', () => {
        if (profileModal) {
            const input = document.getElementById('profile-name');
            if (input && currentUserProfile) {
                input.value = currentUserProfile.displayName || '';
            }
            document.getElementById('profile-desc').textContent = `Manage your ${currentUserProfile?.subscriptionTier || ''} account.`;
            document.getElementById('profile-password-msg').style.display = 'none';
            document.getElementById('profile-new-password').value = '';

            loadSearchHistory();

            profileModal.classList.add('visible');
        }
    });

    document.getElementById('profile-history-next-btn')?.addEventListener('click', () => {
        loadSearchHistory(true);
    });

    document.getElementById('profile-password-btn')?.addEventListener('click', async (e) => {
        const passInput = document.getElementById('profile-new-password');
        const msg = document.getElementById('profile-password-msg');
        const newPass = passInput.value;
        const btn = e.currentTarget;

        if (newPass.length < 6) {
            msg.textContent = 'Password must be at least 6 characters.';
            msg.style.display = 'block';
            return;
        }

        btn.textContent = 'Updating...';
        msg.style.display = 'none';

        try {
            await updatePassword(currentUser, newPass);
            btn.textContent = 'Password Updated!';
            passInput.value = '';
            setTimeout(() => btn.textContent = 'Change Password', 3000);
        } catch (err) {
            console.error(err);
            msg.textContent = err.message || 'Failed to update password. You may need to sign out and sign back in.';
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
        e.currentTarget.textContent = 'Saving...';
        try {
            await updateDoc(doc(db, 'tagly_users', currentUser.uid), { displayName: newName });
            e.currentTarget.textContent = 'Updated!';
            setTimeout(() => e.currentTarget.textContent = 'Update Name', 2000);
        } catch (err) {
            console.error(err);
            e.currentTarget.textContent = 'Failed';
            setTimeout(() => e.currentTarget.textContent = 'Update Name', 2000);
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
