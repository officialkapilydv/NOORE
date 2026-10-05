import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'noore-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminKey: process.env.ADMIN_KEY || 'noore-admin',
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
    data: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../data'),
    publicDir: path.resolve(__dirname, '../public'),
    clientDist: path.resolve(__dirname, '../../client/dist'),
  },
};
