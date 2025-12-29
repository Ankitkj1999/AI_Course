import express from 'express';
import nodemailer from 'nodemailer';
import axios from 'axios';
import Stripe from 'stripe';
import Flutterwave from 'flutterwave-node-v3';
import { User, Admin, Subscription } from '../models/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize payment providers
let stripe = null;
let flw = null;

try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        logger.info('✅ Stripe initialized in payment routes');
    } else {
        logger.warn('⚠️ Stripe not configured - payment features will be limited');
    }
} catch (error) {
    logger.error('❌ Stripe initialization failed in payment routes:', error.message);
}

try {
    if (process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY) {
        flw = new Flutterwave(
            process.env.FLUTTERWAVE_PUBLIC_KEY,
            process.env.FLUTTERWAVE_SECRET_KEY
        );
        logger.info('✅ Flutterwave initialized in payment routes');
    } else {
        logger.warn('⚠️ Flutterwave not configured - payment features will be limited');
    }
} catch (error) {
    logger.error('❌ Flutterwave initialization failed in payment routes:', error.message);
}

// Helper function to get email transporter
const getTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
};

// Helper: Send renewal email
async function sendRenewEmail(id) {
    try {
        const subscriptionDetails = await Subscription.findOne({ subscription: id });
        const userId = subscriptionDetails.user;
        const userDetails = await User.findOne({ _id: userId });
        const transporter = getTransporter();

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: userDetails.email,
            subject: `${userDetails.mName} Your Subscription Plan Has Been Renewed`,
            html: `<p>${userDetails.mName}, your subscription plan has been Renewed.</p>`
        });
    } catch (error) {
        logger.error('Send renew email error:', error);
    }
}

// Helper: Update subscription
async function updateSubscription(id, subject) {
    try {
        const subscriptionDetails = await Subscription.findOne({ subscription: id });
        const userId = subscriptionDetails.user;
        await User.findOneAndUpdate({ _id: userId }, { $set: { type: 'free' } });
        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscription: id });
        await sendCancelEmail(userDetails.email, userDetails.mName, subject);
        logger.info(`Subscription updated: ${id} - ${subject}`);
    } catch (error) {
        logger.error('Update subscription error:', error);
    }
}

// Helper: Send cancel email
async function sendCancelEmail(email, name, subject) {
    const transporter = getTransporter();
    const Reactivate = process.env.WEBSITE_URL + '/pricing';

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: `${name} Your Subscription Plan Has Been ${subject}`,
        html: `<p>${name}, your subscription plan has been ${subject}. <a href="${Reactivate}">Reactivate</a></p>`
    });
}

// GET SUBSCRIPTION DETAILS (Multi-provider)
router.post('/subscriptiondetail', async (req, res) => {
    try {
        const { uid, email } = req.body;
        const userDetails = await Subscription.findOne({ user: uid });

        if (userDetails.method === 'stripe') {
            const subscription = await stripe.subscriptions.retrieve(userDetails.subscriberId);
            res.json({ session: subscription, method: userDetails.method });
        } else if (userDetails.method === 'paypal') {
            const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
            const PAYPAL_APP_SECRET_KEY = process.env.PAYPAL_APP_SECRET_KEY;
            const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_APP_SECRET_KEY).toString('base64');
            const response = await fetch(
                `https://api-m.paypal.com/v1/billing/subscriptions/${userDetails.subscription}`,
                {
                    headers: {
                        Authorization: 'Basic ' + auth,
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    }
                }
            );
            const session = await response.json();
            res.json({ session: session, method: userDetails.method });
        } else if (userDetails.method === 'flutterwave') {
            if (!flw) {
                res.status(500).json({ success: false, message: "Flutterwave not configured" });
                return;
            }
            const payload = { email: email };
            const response = await flw.Subscription.get(payload);
            res.json({ session: response['data'][0], method: userDetails.method });
        } else if (userDetails.method === 'paystack') {
            const response = await axios.get(
                `https://api.paystack.co/subscription/${userDetails.subscriberId}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                    }
                }
            );
            res.json({
                session: {
                    subscription_code: response.data.data.subscription_code,
                    createdAt: response.data.data.createdAt,
                    updatedAt: response.data.data.updatedAt,
                    customer_code: userDetails.subscription,
                    email_token: response.data.data.email_token
                },
                method: userDetails.method
            });
        } else {
            // Razorpay
            const config = {
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: process.env.RAZORPAY_KEY_ID,
                    password: process.env.RAZORPAY_KEY_SECRET
                }
            };
            axios
                .get(`https://api.razorpay.com/v1/subscriptions/${userDetails.subscription}`, config)
                .then((response) => {
                    res.json({ session: response.data, method: userDetails.method });
                })
                .catch((error) => {
                    logger.error('Razorpay get details error:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
        }
    } catch (error) {
        logger.error('Get subscription details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DOWNLOAD RECEIPT
router.post('/downloadreceipt', async (req, res) => {
    const { html, email } = req.body;
    const transporter = getTransporter();

    const options = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Subscription Receipt',
        html: html
    };

    transporter.sendMail(options, (error, info) => {
        if (error) {
            logger.error('Download receipt error:', error);
            res.status(500).json({ success: false, message: 'Failed to send receipt' });
        } else {
            res.json({ success: true, message: 'Receipt sent to your mail' });
        }
    });
});

// SEND RECEIPT
router.post('/sendreceipt', async (req, res) => {
    const { html, email, plan, subscriberId, user, method, subscription } = req.body;
    
    const existingSubscription = await Subscription.findOne({ user: user });
    if (!existingSubscription) {
        const newSub = new Subscription({
            user,
            subscription,
            subscriberId,
            plan,
            method
        });
        await newSub.save();
        logger.info(`New subscription created for user ${user}`);
    }

    const transporter = getTransporter();
    transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Subscription Payment',
        html: html
    }, (error, info) => {
        if (error) {
            logger.error('Send receipt error:', error);
            res.status(500).json({ success: false, message: 'Failed to send receipt' });
        } else {
            res.json({ success: true, message: 'Receipt sent to your mail' });
        }
    });
});

// PAYPAL WEBHOOKS
router.post('/paypalwebhooks', async (req, res) => {
    const body = req.body;
    const event_type = body.event_type;

    switch (event_type) {
        case 'BILLING.SUBSCRIPTION.CANCELLED':
            await updateSubscription(body['resource']['id'], 'Cancelled');
            break;
        case 'BILLING.SUBSCRIPTION.EXPIRED':
            await updateSubscription(body['resource']['id'], 'Expired');
            break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
            await updateSubscription(body['resource']['id'], 'Suspended');
            break;
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
            await updateSubscription(body['resource']['id'], 'Disabled Due To Payment Failure');
            break;
        case 'PAYMENT.SALE.COMPLETED':
            await sendRenewEmail(body['resource']['billing_agreement_id']);
            break;
        default:
            logger.info(`Unhandled PayPal webhook event: ${event_type}`);
    }
    res.sendStatus(200);
});

// PAYPAL PAYMENT
router.post('/paypal', async (req, res) => {
    const { planId, email, name, lastName, post, address, country, brand, admin } = req.body;
    
    try {
        const firstLine = address.split(',').slice(0, -1).join(',');
        const secondLine = address.split(',').pop();
        const auth = Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_APP_SECRET_KEY
        ).toString('base64');
        
        const response = await fetch('https://api-m.paypal.com/v1/billing/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                plan_id: planId,
                subscriber: {
                    name: { given_name: name, surname: lastName },
                    email_address: email,
                    shipping_address: {
                        name: { full_name: name },
                        address: {
                            address_line_1: firstLine,
                            address_line_2: secondLine,
                            admin_area_2: admin,
                            admin_area_1: country,
                            postal_code: post,
                            country_code: country
                        }
                    }
                },
                application_context: {
                    brand_name: process.env.COMPANY,
                    locale: 'en-US',
                    shipping_preference: 'SET_PROVIDED_ADDRESS',
                    user_action: 'SUBSCRIBE_NOW',
                    payment_method: {
                        payer_selected: 'PAYPAL',
                        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
                    },
                    return_url: `${process.env.WEBSITE_URL}/payment-success/${planId}`,
                    cancel_url: `${process.env.WEBSITE_URL}/payment-failed`
                }
            }),
            headers: {
                Authorization: 'Basic ' + auth,
                'Content-Type': 'application/json'
            }
        });
        const session = await response.json();
        logger.info(`PayPal subscription created for ${email}`);
        res.send(session);
    } catch (error) {
        logger.error('PayPal payment error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/paypaldetails', async (req, res) => {
    const { subscriberId, uid, plan } = req.body;
    let cost = 0;
    if (plan === process.env.MONTH_TYPE) {
        cost = process.env.MONTH_COST;
    } else {
        cost = process.env.YEAR_COST;
    }
    cost = cost / 4;
    await Admin.findOneAndUpdate({ type: 'main' }, { $inc: { total: cost } });
    await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
        .then(async () => {
            const auth = Buffer.from(
                process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_APP_SECRET_KEY
            ).toString('base64');
            const response = await fetch(
                `https://api-m.paypal.com/v1/billing/subscriptions/${subscriberId}`,
                { headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json', Accept: 'application/json' } }
            );
            const session = await response.json();
            res.send(session);
        })
        .catch((error) => {
            logger.error('PayPal details error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});

router.post('/paypalcancel', async (req, res) => {
    const { id, email } = req.body;
    const auth = Buffer.from(
        process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_APP_SECRET_KEY
    ).toString('base64');
    
    await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reason: 'Not satisfied with the service' })
    }).then(async () => {
        try {
            const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
            const userId = subscriptionDetails.user;
            await User.findOneAndUpdate({ _id: userId }, { $set: { type: 'free' } });
            const userDetails = await User.findOne({ _id: userId });
            await Subscription.findOneAndDelete({ subscription: id });
            await sendCancelEmail(userDetails.email, userDetails.mName, 'Cancelled');
            logger.info(`PayPal subscription cancelled for ${email}`);
            res.json({ success: true, message: '' });
        } catch (error) {
            logger.error('PayPal cancel error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
});

router.post('/paypalupdate', async (req, res) => {
    const { id, idPlan } = req.body;
    const auth = Buffer.from(
        process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_APP_SECRET_KEY
    ).toString('base64');
    try {
        const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${id}/revise`, {
            method: 'POST',
            headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan_id: idPlan,
                application_context: {
                    brand_name: process.env.COMPANY,
                    locale: 'en-US',
                    payment_method: { payer_selected: 'PAYPAL', payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED' },
                    return_url: `${process.env.WEBSITE_URL}/payment-success/${idPlan}`,
                    cancel_url: `${process.env.WEBSITE_URL}/payment-failed`
                }
            })
        });
        const session = await response.json();
        res.send(session);
    } catch (error) {
        logger.error('PayPal update error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/paypalupdateuser', async (req, res) => {
    const { id, mName, email, user, plan } = req.body;
    await Subscription.findOneAndUpdate({ subscription: id }, { $set: { plan: plan } }).then(async () => {
        await User.findOneAndUpdate({ _id: user }, { $set: { type: plan } }).then(async () => {
            const transporter = getTransporter();
            await transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: `${mName} Your Subscription Plan Has Been Modified`,
                html: `<p>${mName}, your subscription plan has been Modified.</p>`
            });
            logger.info(`PayPal subscription updated for ${email}`);
        });
    });
});

// STRIPE ROUTES
router.post('/stripepayment', async (req, res) => {
    const { planId } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            success_url: `${process.env.WEBSITE_URL}/payment-success/${planId}`,
            cancel_url: `${process.env.WEBSITE_URL}/payment-failed`,
            line_items: [{ price: planId, quantity: 1 }],
            mode: 'subscription'
        });
        logger.info(`Stripe checkout session created: ${session.id}`);
        res.json({ url: session.url, id: session.id });
    } catch (e) {
        logger.error('Stripe payment error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/stripedetails', async (req, res) => {
    const { subscriberId, uid, plan } = req.body;
    let cost = 0;
    if (plan === process.env.MONTH_TYPE) { cost = process.env.MONTH_COST; } 
    else { cost = process.env.YEAR_COST; }
    cost = cost / 4;
    await Admin.findOneAndUpdate({ type: 'main' }, { $inc: { total: cost } });
    await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
        .then(async () => {
            const session = await stripe.checkout.sessions.retrieve(subscriberId);
            res.send(session);
        })
        .catch((error) => {
            logger.error('Stripe details error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});

router.post('/stripecancel', async (req, res) => {
    const { id, email } = req.body;
    await stripe.subscriptions.cancel(id);
    try {
        const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
        const userId = subscriptionDetails.user;
        await User.findOneAndUpdate({ _id: userId }, { $set: { type: 'free' } });
        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscriberId: id });
        await sendCancelEmail(userDetails.email, userDetails.mName, 'Cancelled');
        logger.info(`Stripe subscription cancelled for ${email}`);
        res.json({ success: true, message: '' });
    } catch (error) {
        logger.error('Stripe cancel error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// RAZORPAY ROUTES
router.post('/razorpaycreate', async (req, res) => {
    const { plan, email, fullAddress } = req.body;
    try {
        const config = {
            headers: { 'Content-Type': 'application/json' },
            auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET }
        };
        axios.post('https://api.razorpay.com/v1/subscriptions', JSON.stringify({
            plan_id: plan,
            total_count: 12,
            quantity: 1,
            customer_notify: 1,
            notes: { notes_key_1: fullAddress },
            notify_info: { notify_email: email }
        }), config)
            .then((response) => {
                logger.info(`Razorpay subscription created for ${email}`);
                res.send(response.data);
            })
            .catch((error) => {
                logger.error('Razorpay create error:', error);
                res.status(500).json({ error: 'Internal server error' });
            });
    } catch (error) {
        logger.error('Razorpay create error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/razorapydetails', async (req, res) => {
    const { subscriberId, uid, plan } = req.body;
    let cost = 0;
    if (plan === process.env.MONTH_TYPE) { cost = process.env.MONTH_COST; } 
    else { cost = process.env.YEAR_COST; }
    cost = cost / 4;
    await Admin.findOneAndUpdate({ type: 'main' }, { $inc: { total: cost } });
    await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
        .then(async () => {
            const config = {
                headers: { 'Content-Type': 'application/json' },
                auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET }
            };
            axios.get(`https://api.razorpay.com/v1/subscriptions/${subscriberId}`, config)
                .then((response) => res.send(response.data))
                .catch((error) => logger.error('Razorpay get error:', error));
        })
        .catch((error) => {
            logger.error('Razorpay details error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});

router.post('/razorapypending', async (req, res) => {
    const { sub } = req.body;
    const config = {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET }
    };
    axios.get(`https://api.razorpay.com/v1/subscriptions/${sub}`, config)
        .then((response) => res.send(response.data))
        .catch((error) => {
            logger.error('Razorpay pending error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

router.post('/razorpaycancel', async (req, res) => {
    const { id, email } = req.body;
    const config = {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET }
    };
    axios.post(`https://api.razorpay.com/v1/subscriptions/${id}/cancel`, { cancel_at_cycle_end: 0 }, config)
        .then(async () => {
            try {
                const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
                const userId = subscriptionDetails.user;
                await User.findOneAndUpdate({ _id: userId }, { $set: { type: 'free' } });
                const userDetails = await User.findOne({ _id: userId });
                await Subscription.findOneAndDelete({ subscription: id });
                await sendCancelEmail(userDetails.email, userDetails.mName, 'Cancelled');
                logger.info(`Razorpay subscription cancelled for ${email}`);
                res.json({ success: true, message: '' });
            } catch (error) {
                logger.error('Razorpay cancel error:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        })
        .catch((error) => {
            logger.error('Razorpay cancel API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// PAYSTACK ROUTES
router.post('/paystackpayment', async (req, res) => {
    const { planId, amountInZar, email } = req.body;
    try {
        axios.post('https://api.paystack.co/transaction/initialize', {
            email: email,
            amount: amountInZar,
            plan: planId
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                if (response.data.status) {
                    logger.info(`Paystack transaction initialized for ${email}`);
                    res.json({ url: response.data.data.authorization_url });
                } else {
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            })
            .catch((error) => {
                logger.error('Paystack payment error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    } catch (e) {
        logger.error('Paystack payment error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/paystackfetch', async (req, res) => {
    const { email, uid, plan } = req.body;
    try {
        axios.get('https://api.paystack.co/subscription', {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        })
            .then(async (response) => {
                const jsonData = response.data;
                let subscriptionDetails = null;
                jsonData.data.forEach((subscription) => {
                    if (subscription.customer.email === email) {
                        subscriptionDetails = {
                            subscription_code: subscription.subscription_code,
                            createdAt: subscription.createdAt,
                            updatedAt: subscription.updatedAt,
                            customer_code: subscription.customer.customer_code
                        };
                    }
                });
                if (subscriptionDetails) {
                    let cost = 0;
                    if (plan === process.env.MONTH_TYPE) { cost = process.env.MONTH_COST; } 
                    else { cost = process.env.YEAR_COST; }
                    cost = cost / 4;
                    await Admin.findOneAndUpdate({ type: 'main' }, { $inc: { total: cost } });
                    await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
                        .then(async () => res.json({ details: subscriptionDetails }))
                        .catch((error) => {
                            logger.error('Paystack fetch error:', error);
                            res.status(500).json({ success: false, message: 'Internal server error' });
                        });
                } else {
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            })
            .catch((error) => {
                logger.error('Paystack fetch error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    } catch (e) {
        logger.error('Paystack fetch error:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/paystackcancel', async (req, res) => {
    const { code, token, email } = req.body;
    axios.post('https://api.paystack.co/subscription/disable', { code: code, token: token }, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })
        .then(async () => {
            const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
            const userId = subscriptionDetails.user;
            await User.findOneAndUpdate({ _id: userId }, { $set: { type: 'free' } });
            const userDetails = await User.findOne({ _id: userId });
            await Subscription.findOneAndDelete({ subscriberId: code });
            await sendCancelEmail(email, userDetails.mName, 'Cancelled');
            logger.info(`Paystack subscription cancelled for ${email}`);
            res.json({ success: true, message: '' });
        })
        .catch((error) => {
            logger.error('Paystack cancel error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// FLUTTERWAVE ROUTES
router.post('/flutterdetails', async (req, res) => {
    const { email, uid, plan } = req.body;
    try {
        let cost = 0;
        if (plan === process.env.MONTH_TYPE) { cost = process.env.MONTH_COST; } 
        else { cost = process.env.YEAR_COST; }
        cost = cost / 4;
        await Admin.findOneAndUpdate({ type: 'main' }, { $inc: { total: cost } });
        await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
            .then(async () => {
                if (!flw) {
                    res.status(500).json({ success: false, message: "Flutterwave not configured" });
                    return;
                }
                const payload = { email: email };
                const response = await flw.Subscription.get(payload);
                res.send(response['data'][0]);
            })
            .catch((error) => {
                logger.error('Flutterwave details error:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            });
    } catch (error) {
        logger.error('Flutterwave details error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/flutterwavecancel', async (req, res) => {
    const { code, token, email } = req.body;
    
    if (!flw) {
        res.status(500).json({ success: false, message: "Flutterwave not configured" });
        return;
    }
    
    const payload = { id: code };
    const response = await flw.Subscription.cancel(payload);
    if (response) {
        const subscriptionDetails = await Subscription.findOne({ subscriberId: email });
        const userId = subscriptionDetails.user;
        await User.findOneAndUpdate({ _id: userId }, { $set: { type: 'free' } });
        const userDetails = await User.findOne({ _id: userId });
        await Subscription.findOneAndDelete({ subscriberId: token });
        await sendCancelEmail(email, userDetails.mName, 'Cancelled');
        logger.info(`Flutterwave subscription cancelled for ${email}`);
        res.json({ success: true, message: '' });
    } else {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;