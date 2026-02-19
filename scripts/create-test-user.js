/**
 * Create a test user in Supabase Auth.
 * Usage:
 *   node scripts/create-test-user.js
 *   node scripts/create-test-user.js myuser@example.com mypassword
 *
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      process.env[key] = val;
    }
  });
}

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.argv[2] || process.env.TEST_USER_EMAIL || 'test@example.com';
const password = process.argv[3] || process.env.TEST_USER_PASSWORD || 'TestPassword123';
const fullName = process.argv[4] || process.env.TEST_USER_NAME || 'Test User';

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: undefined,
    },
  });
  if (error) {
    console.error('Error creating user:', error.message);
    if (error.message.includes('already registered')) {
      console.log('User already exists. Sign in at your app or reset password in Supabase Dashboard.');
    }
    process.exit(1);
  }
  console.log('Test user created:');
  console.log('  Email:    ', email);
  console.log('  Password: ', password);
  console.log('  Name:     ', fullName);
  if (data?.user && !data.user.identities?.length) {
    console.log('\nNote: This email is already registered. Use a different email or sign in.');
  } else if (data?.user?.email_confirmed_at) {
    console.log('\nYou can sign in immediately.');
  } else {
    console.log('\nConfirm email via the link sent to', email, '(or disable "Confirm email" in Supabase Auth settings for testing).');
  }
}

main();
