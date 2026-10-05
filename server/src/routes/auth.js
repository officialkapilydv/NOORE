import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { collection } from '../db/store.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { HttpError, validate } from '../middleware/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { uid } from '../utils/ids.js';

const router = Router();
const users = collection('users');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name.').max(80),
  email: z.string().trim().email('Please enter a valid email.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
});
const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email.'),
  password: z.string().min(1, 'Please enter your password.'),
});

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

router.post('/register', rateLimit({ max: 10 }), validate(registerSchema), async (req, res) => {
  const email = req.body.email.toLowerCase();
  if (await users.find((u) => u.email === email)) throw new HttpError(409, 'An account with this email already exists.');
  const user = await users.insert({
    id: uid('usr_'),
    name: req.body.name,
    email,
    passwordHash: await bcrypt.hash(req.body.password, 10),
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', rateLimit({ max: 15 }), validate(loginSchema), async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await users.find((u) => u.id === req.user.sub);
  if (!user) throw new HttpError(401, 'Account not found.');
  res.json({ user: publicUser(user) });
});

export default router;
