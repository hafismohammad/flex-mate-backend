// stripeClient.ts
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.REACT_STRIPE_SECRET_KEY as string;
const stripe = new Stripe(stripeSecretKey, {
   apiVersion: '2022-11-15' as any,
});

export default stripe;
