import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './errors.js';

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
export function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] && req.headers['x-admin-key'] === config.adminKey) {
    req.admin = { name: 'API key', role: 'admin' };
    return next();
  }
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Admin sign-in required.'));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.role !== 'admin') return next(new HttpError(403, 'This account is not an administrator.'));
    req.admin = payload;
    next();
  } catch {
    next(new HttpError(401, 'Your admin session has expired. Please sign in again.'));
  }
}
