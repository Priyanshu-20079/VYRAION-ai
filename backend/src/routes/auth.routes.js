import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { protect } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';
import { activeOperatorSession, invalidateAndStartSession } from '../services/sessionManager.js';

const router = express.Router();

// Rate limiter for authentication endpoints (Max 10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Fallback in-memory user database if MongoDB connection is inactive
const memoryUsers = new Map();

// Helper to pre-populate memory database with demo credentials
const hashPasswordSync = (password) => {
  return bcrypt.hashSync(password, 10);
};

// In-memory demo accounts
memoryUsers.set('operator@vyraion.demo', { id: 'usr_operator', name: 'Operator Console', email: 'operator@vyraion.demo', password: hashPasswordSync('demo123'), role: 'operator', createdAt: new Date() });
memoryUsers.set('admin@vyraion.demo', { id: 'usr_admin', name: 'System Admin', email: 'admin@vyraion.demo', password: hashPasswordSync('demo123'), role: 'admin', createdAt: new Date() });
memoryUsers.set('police@vyraion.demo', { id: 'usr_police', name: 'Police Command', email: 'police@vyraion.demo', password: hashPasswordSync('demo123'), role: 'authority', createdAt: new Date() });
memoryUsers.set('hospital@vyraion.demo', { id: 'usr_hospital', name: 'Hospital Ops', email: 'hospital@vyraion.demo', password: hashPasswordSync('demo123'), role: 'hospital', createdAt: new Date() });
memoryUsers.set('investigator@vyraion.demo', { id: 'usr_investigator', name: 'Investigator', email: 'investigator@vyraion.demo', password: hashPasswordSync('demo123'), role: 'investigator', createdAt: new Date() });
memoryUsers.set('reviewer@vyraion.demo', { id: 'usr_reviewer', name: 'Reviewer', email: 'reviewer@vyraion.demo', password: hashPasswordSync('demo123'), role: 'reviewer', createdAt: new Date() });
memoryUsers.set('user@vyraion.demo', { id: 'usr_user', name: 'Public User', email: 'user@vyraion.demo', password: hashPasswordSync('demo123'), role: 'user', createdAt: new Date() });
// Keep legacy operator
memoryUsers.set('operator@vyraion.ai', { id: 'usr_operator_legacy', name: 'Operator Console', email: 'operator@vyraion.ai', password: hashPasswordSync('Dispatch@2026'), role: 'operator', createdAt: new Date() });

/* ═══════════════════════════════════════════════════════════
   ROLE POLICY (Single Source of Truth)
   ──────────────────────────────────────────────────────────
   operator@vyraion.ai  → OPERATOR
   everyone else        → ADMIN
   
   Role is ALWAYS computed from email. The DB role field is
   never trusted — it is always overwritten at login time.
═══════════════════════════════════════════════════════════ */
const resolveRole = (email) => {
  if (!email) return 'admin';
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'operator@vyraion.ai' || cleanEmail === 'operator@vyraion.demo') return 'operator';
  if (cleanEmail === 'admin@vyraion.demo') return 'admin';
  if (cleanEmail === 'police@vyraion.demo') return 'authority';
  if (cleanEmail === 'hospital@vyraion.demo') return 'hospital';
  if (cleanEmail === 'investigator@vyraion.demo') return 'investigator';
  if (cleanEmail === 'reviewer@vyraion.demo') return 'reviewer';
  if (cleanEmail === 'user@vyraion.demo') return 'user';
  return 'admin';
};

/* ═══════════════════════════════════════════════════════════
   DB MIGRATION — Run once on startup + each login request
   Ensures every non-operator DB record has role = admin.
═══════════════════════════════════════════════════════════ */
let migrationDone = false;
const runRoleMigration = async () => {
  if (migrationDone) return;
  try {
    if (mongoose.connection.readyState === 1) {
      // Removed aggressive role overriding to 'admin'
      // Ensure operator@vyraion.ai record has role = operator
      await User.updateMany(
        { email: 'operator@vyraion.ai' },
        { $set: { role: 'operator' } }
      );

      migrationDone = true;
      logger.info('[Auth Migration] Role migration complete.');
    }
  } catch (err) {
    logger.error(`[Auth Migration Error]: ${err.message}`);
  }
};

// Helper: Generate JWT token
const generateToken = (userId, email, name, role, sessionId = null) => {
  return jwt.sign(
    { id: userId, email, name, role, sessionId },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register — REGISTER USER
═══════════════════════════════════════════════════════════ */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Role is always determined by email — never accepted from client
    const assignedRole = resolveRole(cleanEmail);
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      }

      const newUser = await User.create({ name, email: cleanEmail, password, role: assignedRole });
      const token = generateToken(newUser._id.toString(), newUser.email, newUser.name, assignedRole);
      logger.info(`[Auth Register] ${cleanEmail} registered | role=${assignedRole}`);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, role: assignedRole }
      });
    }

    // Memory fallback
    if (memoryUsers.has(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const mockId = 'usr_' + Date.now();
    const userObj = { id: mockId, name, email: cleanEmail, password: hashedPassword, role: assignedRole, createdAt: new Date() };
    memoryUsers.set(cleanEmail, userObj);
    const token = generateToken(mockId, cleanEmail, name, assignedRole);
    logger.info(`[Auth Register Memory] ${cleanEmail} registered | role=${assignedRole}`);

    return res.status(201).json({
      success: true, message: 'Registration successful!', token,
      user: { id: mockId, name, email: cleanEmail, role: assignedRole }
    });

  } catch (error) {
    logger.error(`[Auth Register Exception]: ${error.message}`);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login — LOGIN (ROLE ALWAYS FROM EMAIL)
═══════════════════════════════════════════════════════════ */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, force } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    // ── ROLE IS ALWAYS DETERMINED BY EMAIL ──────────────────────────────────
    const assignedRole = resolveRole(cleanEmail);
    // ────────────────────────────────────────────────────────────────────────

    // Run DB role migration (idempotent, runs once per server restart)
    await runRoleMigration();

    // ── OPERATOR PATH ────────────────────────────────────────────────────────
    if (assignedRole === 'operator') {
      const isValidOpPassword = (cleanEmail === 'operator@vyraion.demo' && password === 'demo123') || (cleanEmail === 'operator@vyraion.ai' && password === 'Dispatch@2026');
      if (!isValidOpPassword) {
        logger.warn(`[Auth Login FAILURE] Invalid password for operator: ${cleanEmail}`);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Single active session enforcement
      if (activeOperatorSession.sessionId && force !== true) {
        return res.status(409).json({
          success: false,
          sessionActive: true,
          message: 'Operator session already active.'
        });
      }

      const newSessionId = invalidateAndStartSession('operator@vyraion.ai');
      const opId = 'usr_operator_01';
      const opName = 'Operator Console';
      const token = generateToken(opId, cleanEmail, opName, 'operator', newSessionId);

      // Ensure operator record exists in MongoDB
      if (isMongoConnected) {
        try {
          await User.findOneAndUpdate(
            { email: cleanEmail },
            { $set: { role: 'operator', name: opName } },
            { upsert: true, new: true }
          );
        } catch (err) {
          logger.error(`[Auth Operator Upsert Error]: ${err.message}`);
        }
      }

      logger.info(`[Auth Login] Operator authenticated (Session: ${newSessionId})`);
      return res.json({
        success: true, message: 'Sign in successful!', token,
        user: { id: opId, name: opName, email: cleanEmail, role: 'operator', sessionId: newSessionId }
      });
    }

    // ── GENERAL PATH ───────────────────────────────────────────────────────────
    if (isMongoConnected) {
      let user = await User.findOne({
        $or: [{ email: cleanEmail }, { username: cleanEmail }]
      }).select('+password');

      if (!user) {
        // First-time login — auto-register
        logger.info(`[Auth Login] Auto-registering new user: ${cleanEmail}`);
        user = await User.create({
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          username: cleanEmail.split('@')[0],
          password: password,
          role: assignedRole
        });
      }

      // Always enforce correct role from email policy
      if (user.role !== assignedRole) {
        logger.warn(`[Auth Login] Correcting stale role for ${cleanEmail}: "${user.role}" → "${assignedRole}"`);
        user.role = assignedRole;
        await user.save();
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(user._id.toString(), user.email, user.name, assignedRole);
      logger.info(`[Auth Login] User authenticated: ${cleanEmail} (${user._id})`);

      return res.json({
        success: true, message: 'Sign in successful!', token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: assignedRole }
      });
    }

    // ── MEMORY FALLBACK ──────────────────────────────────────────────────────
    logger.warn(`[Auth Login] MongoDB inactive. Using memory store for: ${cleanEmail}`);
    let userInMem = memoryUsers.get(cleanEmail);

    if (!userInMem && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userInMem = {
        id: 'usr_mem_' + Date.now(),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: hashedPassword,
        role: assignedRole,
        createdAt: new Date()
      };
      memoryUsers.set(cleanEmail, userInMem);
    }

    if (!userInMem) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, userInMem.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Always use resolved role, not whatever is stored in memory
    const token = generateToken(userInMem.id, userInMem.email, userInMem.name, assignedRole);
    logger.info(`[Auth Login Memory] ${cleanEmail} | role=${assignedRole}`);

    return res.json({
      success: true, message: 'Sign in successful!', token,
      user: { id: userInMem.id, name: userInMem.name, email: userInMem.email, role: assignedRole }
    });

  } catch (error) {
    logger.error(`[Auth Login Exception]: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message || 'Server error during sign in.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET /api/auth/me — SESSION RESTORATION
   Always re-computes role from email — never trusts JWT role.
═══════════════════════════════════════════════════════════ */
router.get('/me', protect, async (req, res) => {
  try {
    const emailFromToken = req.user?.email || '';
    const computedRole = resolveRole(emailFromToken);

    // Operator session validity check
    if (computedRole === 'operator') {
      if (req.user.sessionId !== activeOperatorSession.sessionId) {
        logger.warn(`[Auth /me] Operator session mismatch — evicting stale token`);
        return res.status(401).json({ success: false, message: 'Session expired or transferred to another device.' });
      }
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Always override DB role with the computed role
        return res.json({
          success: true,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: computedRole,
            sessionId: req.user.sessionId || null
          }
        });
      }
    }

    // JWT fallback — override role with computed value
    return res.json({
      success: true,
      user: { ...req.user, role: computedRole }
    });

  } catch (e) {
    logger.error(`[Auth /me Error]: ${e.message}`);
    const computedRole = resolveRole(req.user?.email || '');
    return res.json({ success: true, user: { ...req.user, role: computedRole } });
  }
});

export default router;
