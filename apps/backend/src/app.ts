import dotenv from 'dotenv';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { CreateOrderSchema, VerifyPaymentSchema, CreateCodOrderSchema } from './schemas';
import { getSupabaseAdmin } from './supabaseAdmin';

dotenv.config();

export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['POST', 'GET'],
    credentials: true,
  })
);
app.use(express.json());
app.use(pinoHttp({ logger }));

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

app.post('/api/create-order', orderLimiter, async (req, res) => {
  const result = CreateOrderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  try {
    const { amount, currency, receipt } = result.data;
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: message }, 'Error creating order');
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  const result = VerifyPaymentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = result.data;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const receivedBuf = Buffer.from(razorpay_signature, 'hex');
    const valid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!valid) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Payment verified — persist the order server-side with service role key
    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from('orders')
      .insert({
        user_id: orderData.userId ?? null,
        total: orderData.total,
        items: orderData.items,
        status: 'Paid',
        payment_method: orderData.paymentMethod,
        shipping_fee: orderData.shippingFee,
        coupon_code: orderData.couponCode || null,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: 'paid',
        shipping_address: orderData.shippingAddress,
      })
      .select('id')
      .single();

    if (orderError) {
      logger.error({ err: orderError }, 'Failed to persist order after payment verification');
      return res.status(500).json({
        error: 'Payment verified but order record failed. Contact support.',
        razorpay_payment_id,
      });
    }

    // Atomically increment coupon usage if a coupon was applied
    if (orderData.couponCode) {
      const { error: couponError } = await getSupabaseAdmin().rpc('increment_coupon_uses', {
        coupon_code: orderData.couponCode,
      });
      if (couponError) {
        logger.warn({ err: couponError, code: orderData.couponCode }, 'Failed to increment coupon uses');
      }
    }

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    logger.error({ err: error }, 'Error verifying payment');
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

app.post('/api/create-cod-order', orderLimiter, async (req, res) => {
  const result = CreateCodOrderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  try {
    const { userId, items, total, shippingFee, couponCode, shippingAddress } = result.data;

    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from('orders')
      .insert({
        user_id: userId ?? null,
        total,
        items,
        status: 'Processing',
        payment_method: 'cod',
        shipping_fee: shippingFee,
        coupon_code: couponCode || null,
        payment_status: 'pending',
        shipping_address: shippingAddress,
      })
      .select('id')
      .single();

    if (orderError) {
      logger.error({ err: orderError }, 'Failed to create COD order');
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Atomically increment coupon usage if a coupon was applied
    if (couponCode) {
      const { error: couponError } = await getSupabaseAdmin().rpc('increment_coupon_uses', {
        coupon_code: couponCode,
      });
      if (couponError) {
        logger.warn({ err: couponError, code: couponCode }, 'Failed to increment coupon uses');
      }
    }

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    logger.error({ err: error }, 'Error creating COD order');
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});