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

export const env = {
  VITE_SUPABASE_URL: parsed.data.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: parsed.data.VITE_SUPABASE_ANON_KEY,
  VITE_FIREBASE_API_KEY: parsed.data.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: parsed.data.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: parsed.data.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: parsed.data.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: parsed.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: parsed.data.VITE_FIREBASE_APP_ID,
};

export type Env = typeof env;