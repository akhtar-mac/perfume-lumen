import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'Missing Supabase anon key'),
  VITE_FIREBASE_API_KEY: z.string().min(10, 'Missing Firebase API key'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Missing Firebase auth domain'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'Missing Firebase project ID'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'Missing Firebase app ID'),
  VITE_API_URL: z
    .string()
    .url('VITE_API_URL must be set to your backend URL (e.g. https://api.lumenperfumes.com)')
    .optional()
    .or(z.literal('')),
  VITE_RAZORPAY_KEY_ID: z.string().startsWith('rzp_', 'Must be a valid Razorpay key ID'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map(i => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `\n\n[ENV] Missing or invalid environment variables:\n${issues}\n\n` +
      `Copy .env.example to .env.local and fill in the values.\n`
  );
}

if (!parsed.data.VITE_API_URL) {
  console.warn(
    '[ENV] VITE_API_URL is not set. Checkout will fall back to http://localhost:3000.\n' +
      'Set it in production to your backend URL (e.g. https://api.lumenperfumes.com).'
  );
}

export const env = {
  VITE_SUPABASE_URL: parsed.data.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: parsed.data.VITE_SUPABASE_ANON_KEY,
  VITE_FIREBASE_API_KEY: parsed.data.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: parsed.data.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: parsed.data.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: parsed.data.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: parsed.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: parsed.data.VITE_FIREBASE_APP_ID,
  VITE_API_URL: parsed.data.VITE_API_URL || 'http://localhost:3000',
  VITE_RAZORPAY_KEY_ID: parsed.data.VITE_RAZORPAY_KEY_ID,
};

export type Env = typeof env;