import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import type { Express } from 'express';

// Mock Razorpay before importing app
vi.mock('razorpay', () => {
  return {
    default: class MockRazorpay {
      orders = {
        create: vi.fn().mockResolvedValue({
          id: 'order_test123',
          amount: 50000,
          currency: 'INR',
        }),
      };
    },
  };
});

// Mock supabaseAdmin (lazy getter)
vi.mock('../supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'order-uuid-123' }, error: null }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

const FAKE_SECRET = 'testsecret';
process.env.RAZORPAY_KEY_SECRET = FAKE_SECRET;
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.FRONTEND_URL = 'http://localhost:5173';

let app: Express;

beforeAll(async () => {
  const mod = await import('../app.js');
  app = mod.app;
});

function makeSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', FAKE_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');
}

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/create-order', () => {
  it('creates an order with valid amount', async () => {
    const res = await request(app)
      .post('/api/create-order')
      .send({ amount: 499, currency: 'INR' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('order_test123');
  });

  it('rejects zero amount', async () => {
    const res = await request(app).post('/api/create-order').send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects negative amount', async () => {
    const res = await request(app).post('/api/create-order').send({ amount: -100 });
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric amount', async () => {
    const res = await request(app).post('/api/create-order').send({ amount: 'hack' });
    expect(res.status).toBe(400);
  });

  it('rejects amount over max', async () => {
    const res = await request(app).post('/api/create-order').send({ amount: 999999 });
    expect(res.status).toBe(400);
  });

  it('rejects missing amount', async () => {
    const res = await request(app).post('/api/create-order').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/verify-payment', () => {
  const orderId = 'order_test123';
  const paymentId = 'pay_test456';

  const validOrderData = {
    items: [{ id: '1', title: 'Test Perfume', price: 499, quantity: 1 }],
    total: 499,
    paymentMethod: 'upi',
    shippingFee: 0,
    shippingAddress: {
      name: 'Test User',
      phone: '9876543210',
      address: '123 Main St',
      city: 'Mumbai',
      pincode: '400001',
    },
  };

  it('verifies a valid payment and creates order', async () => {
    const signature = makeSignature(orderId, paymentId);
    const res = await request(app)
      .post('/api/verify-payment')
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        orderData: validOrderData,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBe('order-uuid-123');
  });

  it('rejects invalid signature', async () => {
    const res = await request(app)
      .post('/api/verify-payment')
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'invalidsig',
        orderData: validOrderData,
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing orderData', async () => {
    const signature = makeSignature(orderId, paymentId);
    const res = await request(app)
      .post('/api/verify-payment')
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
    expect(res.status).toBe(400);
  });

  it('rejects missing razorpay fields', async () => {
    const res = await request(app)
      .post('/api/verify-payment')
      .send({ razorpay_order_id: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/create-cod-order', () => {
  it('creates a COD order with valid data', async () => {
    const res = await request(app)
      .post('/api/create-cod-order')
      .send({
        items: [{ id: '1', title: 'Test', price: 499, quantity: 1 }],
        total: 499,
        shippingFee: 0,
        shippingAddress: {
          name: 'Test User',
          phone: '9876543210',
          address: '123 St',
          city: 'Mumbai',
          pincode: '400001',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects zero total', async () => {
    const res = await request(app)
      .post('/api/create-cod-order')
      .send({
        items: [],
        total: 0,
        shippingAddress: {
          name: 'Test',
          phone: '1',
          address: 'a',
          city: 'c',
          pincode: '1',
        },
      });
    expect(res.status).toBe(400);
  });

  it('rejects missing shipping address', async () => {
    const res = await request(app)
      .post('/api/create-cod-order')
      .send({ items: [{ id: '1', title: 't', price: 100, quantity: 1 }], total: 100 });
    expect(res.status).toBe(400);
  });
});