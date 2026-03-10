import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from '../lib/firebaseAdmin.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' // use a stable version
});

// Firebase Admin is now handled by the import above.

const tierMappping = {
    creator: { USD: 0.60, AED: 2.20 },
    growth: { USD: 1.85, AED: 6.80 },
    agency: { USD: 4.90, AED: 18.00 }
};

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', express.json(), async (req, res) => {
    try {
        const { firebaseUid, email, tier, currency } = req.body;

        if (!firebaseUid || !tier || !currency) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const price = tierMappping[tier.toLowerCase()]?.[currency.toUpperCase()];
        if (!price) {
            return res.status(400).json({ error: 'Invalid tier or currency' });
        }

        const unit_amount = Math.round(price * 100); // Stripe expects cents

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email, // Associate email with customer if provided
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: `Tagly AI ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
                            description: 'Monthly unlimited access features for the specific tier.',
                        },
                        unit_amount: unit_amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            client_reference_id: firebaseUid,
            metadata: {
                tier: tier,
                firebaseUid: firebaseUid
            },
            success_url: `${req.headers.origin}?checkout=success&tier=${tier}`,
            cancel_url: `${req.headers.origin}?checkout=cancelled`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/payments/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Only verify signature if a secret is provided
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // Unverified local testing (fallback)
            event = JSON.parse(req.body);
        }
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const firebaseUid = session.client_reference_id || session.metadata?.firebaseUid;
            const tier = session.metadata?.tier || 'creator';

            if (firebaseUid && admin.apps.length > 0) {
                try {
                    const db = admin.firestore();
                    // Expiry date (30 days from now)
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);

                    await db.collection('tagly_users').doc(firebaseUid).update({
                        subscriptionTier: tier,
                        subscriptionExpiry: expiryDate.toISOString(),
                        stripeCustomerId: session.customer,
                        subscriptionId: session.subscription
                    });

                    await db.collection('tagly_subscriptions').doc(firebaseUid).set({
                        email: session.customer_details?.email,
                        tier: tier,
                        status: 'active',
                        stripeCustomerId: session.customer,
                        subscriptionId: session.subscription,
                        updatedAt: new Date().toISOString()
                    });

                    console.log(`✅ Subscription successful for user: ${firebaseUid}, tier: ${tier}`);
                } catch (e) {
                    console.error("Firebase admin update failed:", e);
                }
            } else {
                console.log(`⚠️ User update skipped - missing UID or Firebase Admin not initialised`);
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const deletedSubscription = event.data.object;
            const customerId = deletedSubscription.customer;

            if (admin.apps.length > 0) {
                try {
                    const db = admin.firestore();
                    const subSnapshot = await db.collection('tagly_subscriptions').where('stripeCustomerId', '==', customerId).get();

                    if (!subSnapshot.empty) {
                        const userDoc = subSnapshot.docs[0];
                        const uid = userDoc.id;

                        await db.collection('tagly_users').doc(uid).update({
                            subscriptionTier: 'spark' // Downgrade back to free
                        });

                        await db.collection('tagly_subscriptions').doc(uid).update({
                            status: 'canceled',
                            updatedAt: new Date().toISOString()
                        });
                        console.log(`❌ Subscription downgraded for user: ${uid}`);
                    }
                } catch (e) {
                    console.error("Firebase admin delete update failed:", e);
                }
            }
            console.log(`❌ Subscription deleted for customer: ${customerId}`);
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

export default router;
