import { Router, Response } from 'express';
import User from '../models/User.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import passport from 'passport';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, displayName, role: 'CLIENT' });
    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Sign up failed', error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});

// Google OAuth routes
router.get(
  '/google',
  (req, res, next) => {
    // Check if Google credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({ 
        error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' 
      });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { 
      failureRedirect: 'http://localhost:3000/login?error=oauth_failed',
      session: false 
    })(req, res, next);
  },
  (req: any, res) => {
    try {
      const { user, token } = req.user;
      if (!user || !token) {
        return res.redirect('http://localhost:3000/login?error=no_user_data');
      }
      // Redirect to frontend OAuth callback with token
      const redirectUrl = `http://localhost:3000/oauth/callback?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(user._id)}`;
      console.log('✅ Google OAuth successful, redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      res.redirect(`http://localhost:3000/login?error=callback_error`);
    }
  }
);

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({
      uid: user?._id,
      email: user?.email,
      displayName: user?.displayName,
      photoURL: user?.photoURL,
      role: user?.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});

// Admin-only endpoint to create admin user or change user roles
router.post('/admin/setup-admin', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      return res.status(400).json({
        message: 'Admin already exists. Use admin account to manage other users.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const admin = new User({
      email,
      password,
      displayName,
      role: 'ADMIN',
    });
    await admin.save();

    const token = generateToken(admin._id.toString(), admin.email, admin.role);

    res.status(201).json({
      message: 'Admin user created successfully',
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create admin', error });
  }
});

// Admin endpoint to get all users
router.get(
  '/admin/users',
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error });
    }
  }
);

// Admin endpoint to change user role
router.post(
  '/admin/change-role',
  authMiddleware,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { userId, newRole } = req.body;

      if (!['ADMIN', 'LAWYER', 'CLIENT', 'STAFF'].includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'User role updated successfully',
        user,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to change role', error });
    }
  }
);

export default router;
