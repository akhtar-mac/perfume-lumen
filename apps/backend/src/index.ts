import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Email queue storage file
const EMAIL_QUEUE_FILE = path.join(__dirname, '..', 'email-queue.json');

function readEmailQueue(): any[] {
  try {
    if (fs.existsSync(EMAIL_QUEUE_FILE)) {
      const data = fs.readFileSync(EMAIL_QUEUE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading email queue:', e);
  }
  return [];
}

function writeEmailQueue(emails: any[]) {
  try {
    fs.writeFileSync(EMAIL_QUEUE_FILE, JSON.stringify(emails, null, 2));
  } catch (e) {
    console.error('Error writing email queue:', e);
  }
}

// ─── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// ─── CREATE ORDER ──────────────────────────────────────────
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── VERIFY PAYMENT ────────────────────────────────────────
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// ─── QUEUE EMAIL ───────────────────────────────────────────
// Stores email notifications to a JSON queue file.
// Later, when SMTP is configured, these can be processed by a worker.
app.post('/api/queue-email', (req, res) => {
  try {
    const { to, subject, body, type } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const validTypes = ['order_confirmation', 'payment_failed', 'shipping_update'];
    const emailType = validTypes.includes(type) ? type : 'general';

    const emailRecord = {
      id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      to,
      subject,
      body,
      type: emailType,
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    const queue = readEmailQueue();
    queue.push(emailRecord);
    writeEmailQueue(queue);

    console.log(`[Email Queue] Queued ${emailType} email to: ${to}`);

    res.json({
      success: true,
      message: 'Email queued successfully',
      emailId: emailRecord.id,
      email: emailRecord
    });
  } catch (error) {
    console.error('Error queuing email:', error);
    res.status(500).json({ error: 'Failed to queue email' });
  }
});

// ─── GET QUEUED EMAILS (for admin/debug) ───────────────────
app.get('/api/queue-email', (_req, res) => {
  try {
    const queue = readEmailQueue();
    res.json({ count: queue.length, emails: queue });
  } catch (error) {
    console.error('Error reading email queue:', error);
    res.status(500).json({ error: 'Failed to read email queue' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
