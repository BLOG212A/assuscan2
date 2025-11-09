import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

let stripe: Stripe | null = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  });
} else {
  console.warn('[Stripe] STRIPE_SECRET_KEY not configured - billing features disabled');
}

export { stripe };

// Plans de tarification
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    documents_limit: 3,
    features: [
      '3 scans de contrats par mois',
      'Analyse IA basique',
      'Accès à ClaireAI (limité)',
      'Statistiques de base'
    ]
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    documents_limit: 50,
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    features: [
      '50 scans de contrats par mois',
      'Analyse IA avancée',
      'Accès illimité à ClaireAI',
      'Statistiques détaillées',
      'Export PDF des analyses',
      'Support prioritaire'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.99,
    documents_limit: -1, // illimité
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      'Scans illimités',
      'Analyse IA premium',
      'ClaireAI avec contexte étendu',
      'Statistiques avancées',
      'Export multi-formats',
      'API access',
      'Support dédié 24/7',
      'Onboarding personnalisé'
    ]
  }
};

// Créer une session de paiement Stripe Checkout
export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const { priceId, userId, userEmail, successUrl, cancelUrl } = params;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// Créer un portail client pour gérer l'abonnement
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const { customerId, returnUrl } = params;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Récupérer les informations d'un abonnement
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Annuler un abonnement
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.subscriptions.cancel(subscriptionId);
}

// Vérifier le statut d'un webhook Stripe
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
