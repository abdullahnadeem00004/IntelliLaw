import { Router, Response, Request } from 'express';
import session from 'express-session';
import User from '../models/User.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import passport from 'passport';

const router = Router();

// Map userType to role
const getUserRoleByType = (userType: string) => {
  if (userType === 'FIRM') {
    return 'ADMIN';
  }
  if (userType === 'LAWYER') {
    return 'LAWYER';
  }
  return 'CLIENT';
};

const publicUserProfile = (user: any) => ({
  uid: user._id.toString(),
  _id: user._id.toString(),
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  role: user.role,
  userType: user.userType,
  isProfileComplete: user.isProfileComplete,
  firmProfile: user.firmProfile,
  lawyerProfile: user.lawyerProfile,
  clientProfile: user.clientProfile,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName, role: userType = 'CLIENT' } = req.body;

    // Validate userType
    if (!['FIRM', 'LAWYER', 'CLIENT'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userRole = getUserRoleByType(userType);
    const user = new User({
      email,
      password,
      displayName,
      userType,
      role: userRole,
      isProfileComplete: false,
    });
    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role, user.userType);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      userType: user.userType,
      isProfileComplete: user.isProfileComplete,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Sign up failed', error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role: userType } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If userType is specified, verify it matches
    if (userType && user.userType !== userType) {
      return res.status(401).json({ message: 'Invalid role for this account' });
    }

    const expectedRole = getUserRoleByType(user.userType);
    if (user.role !== expectedRole) {
      user.role = expectedRole as any;
      await user.save();
    }

    const token = generateToken(user._id.toString(), user.email, user.role, user.userType);

    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      userType: user.userType,
      isProfileComplete: user.isProfileComplete,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});

// Complete Firm Profile
router.post('/complete-firm-profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { firmProfile } = req.body;

    if (!firmProfile) {
      return res.status(400).json({ message: 'Firm profile data is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        firmProfile,
        isProfileComplete: true,
        userType: 'FIRM',
        role: 'ADMIN',
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Firm profile completed',
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isProfileComplete: user.isProfileComplete,
      userType: user.userType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete firm profile', error });
  }
});

// Complete Lawyer Profile
router.post('/complete-lawyer-profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { lawyerProfile } = req.body;

    if (!lawyerProfile) {
      return res.status(400).json({ message: 'Lawyer profile data is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        lawyerProfile,
        isProfileComplete: true,
        userType: 'LAWYER',
        role: 'LAWYER',
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Lawyer profile completed',
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isProfileComplete: user.isProfileComplete,
      userType: user.userType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete lawyer profile', error });
  }
});

// Complete Client Profile
router.post('/complete-client-profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { clientProfile } = req.body;

    if (!clientProfile) {
      return res.status(400).json({ message: 'Client profile data is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        clientProfile,
        isProfileComplete: true,
        userType: 'CLIENT',
        role: 'CLIENT',
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Client profile completed',
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isProfileComplete: user.isProfileComplete,
      userType: user.userType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete client profile', error });
  }
});

// Google OAuth routes
router.get(
  '/google',
  (req: Request & { session?: any }, res, next) => {
    // Check if Google credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({
        error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env',
      });
    }

    // Store the role in the session state
    const { role } = req.query;
    if (role) {
      req.session = req.session || {};
      req.session.selectedRole = role;
    }

    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      failureRedirect: 'http://localhost:3000/role-selection?error=oauth_failed',
      session: false,
    })(req, res, next);
  },
  (req: any, res) => {
    try {
      const { user, token } = req.user;
      if (!user || !token) {
        return res.redirect('http://localhost:3000/role-selection?error=no_user_data');
      }
      // Redirect to frontend OAuth callback with token
      const redirectUrl = `http://localhost:3000/oauth/callback?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(user._id)}&userType=${encodeURIComponent(user.userType)}`;
      console.log('✅ Google OAuth successful, redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      res.redirect(`http://localhost:3000/role-selection?error=callback_error`);
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
      userType: user?.userType,
      isProfileComplete: user?.isProfileComplete,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});

// Registered lawyer profiles visible to firm accounts.
router.get('/profiles/lawyers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userType ? req.userType !== 'FIRM' : req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Only firms can view registered lawyer profiles' });
    }

    const { search } = req.query;
    const query: any = { userType: 'LAWYER' };

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'lawyerProfile.fullName': { $regex: search, $options: 'i' } },
        { 'lawyerProfile.specialization': { $regex: search, $options: 'i' } },
        { 'lawyerProfile.licenseNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const lawyers = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(lawyers.map(publicUserProfile));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch lawyer profiles', error });
  }
});

// Registered client profiles visible to firms and lawyers.
router.get('/profiles/clients', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const canViewClients = req.userType
      ? ['FIRM', 'LAWYER'].includes(req.userType)
      : ['ADMIN', 'LAWYER'].includes(req.userRole || '');

    if (!canViewClients) {
      return res.status(403).json({ message: 'Only firms and lawyers can view registered client profiles' });
    }

    const { search } = req.query;
    const query: any = { userType: 'CLIENT' };

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'clientProfile.fullName': { $regex: search, $options: 'i' } },
        { 'clientProfile.phoneNumber': { $regex: search, $options: 'i' } },
        { 'clientProfile.city': { $regex: search, $options: 'i' } },
        { 'clientProfile.companyName': { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(clients.map(publicUserProfile));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch client profiles', error });
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
      userType: 'FIRM',
      isProfileComplete: false,
    });
    await admin.save();

    const token = generateToken(admin._id.toString(), admin.email, admin.role, admin.userType);

    res.status(201).json({
      message: 'Admin user created successfully',
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      userType: admin.userType,
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
