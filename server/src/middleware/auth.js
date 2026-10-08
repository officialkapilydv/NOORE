import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { collection } from '../db/store.js';
import { HttpError } from './errors.js';

const sameSecret = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function signToken(user, role = 'customer') {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, config.jwtSecret);
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Please sign in to continue.'));
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    next(new HttpError(401, 'Your session has expired. Please sign in again.'));
  }
}

/** Admin: a Bearer token carrying role=admin, or the static ADMIN_KEY header for scripts. */
export async function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key && config.adminKey && sameSecret(key, config.adminKey)) {
    req.admin = { name: 'API key', role: 'admin' };
    return next();
  }
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Admin sign-in required.'));
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return next(new HttpError(401, 'Your admin session has expired. Please sign in again.'));
  }
  if (payload.role !== 'admin') return next(new HttpError(403, 'This account is not an administrator.'));
  // A removed administrator's token must stop working straight away, not when it expires.
  if (!(await collection('admins').find((a) => a.id === payload.sub))) return next(new HttpError(401, 'This admin account no longer exists.'));
  req.admin = payload;
  next();
}
