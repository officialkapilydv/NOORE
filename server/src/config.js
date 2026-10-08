import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = process.env.NODE_ENV || 'development';
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../data');

// Values shipped in the README, compose files and .env examples — public, so never trusted in production.
const PUBLIC_SECRETS = new Set(['noore-dev-secret-change-me', 'noore-docker-secret-please-change', 'noore-dev-secret', 'replace-with-a-long-random-string']);
const PUBLIC_ADMIN_KEYS = new Set(['noore-admin', 'replace-with-another-random-string']);

/**
 * Anyone who knows the JWT secret can mint an admin token. In production a missing or public
 * secret is replaced by a random one kept in the data volume, so sessions survive restarts.
 */
function jwtSecret() {
  const given = process.env.JWT_SECRET;
  if (env !== 'production') return given || 'noore-dev-secret-change-me';
  if (given && !PUBLIC_SECRETS.has(given)) return given;
  const file = path.join(dataDir, '.jwt-secret');
  try {
    const saved = fs.readFileSync(file, 'utf8').trim();
    if (saved) return saved;
  } catch { /* first boot */ }
  const generated = crypto.randomBytes(48).toString('hex');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, generated, { mode: 0o600 });
  } catch (err) {
    console.warn('[config] could not save the generated JWT secret; sessions will reset on restart:', err.message);
  }
  console.warn('[config] JWT_SECRET is unset or a public default, so a random secret is being used. Set JWT_SECRET to choose your own.');
  return generated;
}

/** The x-admin-key header is only honoured for a key someone actually chose (always in dev/test). */
function adminKey() {
  const given = process.env.ADMIN_KEY;
  if (env !== 'production') return given || 'noore-admin';
  return given && !PUBLIC_ADMIN_KEYS.has(given) ? given : null;
}

export const config = {
  env,
  port: Number(process.env.PORT || 4000),
  jwtSecret: jwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminKey: adminKey(),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  currency: 'INR',
  freeShippingThreshold: 1999,
  shippingFlat: 99,
  giftWrapFee: 149,
  paths: {
    root: path.resolve(__dirname, '..'),
    catalog: path.resolve(__dirname, '../../shared/catalog'),
    data: dataDir,
    publicDir: path.resolve(__dirname, '../public'),
    clientDist: path.resolve(__dirname, '../../client/dist'),
  },
};
