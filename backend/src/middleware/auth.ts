import { Request, Response, NextFunction } from 'express';
import jwt from 'jwt-simple';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userType?: 'FIRM' | 'LAWYER' | 'CLIENT';
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.decode(token, JWT_SECRET);
    const userId = decoded.userId || decoded.uid || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.userId = user._id.toString();
    req.userRole = user.role;
    req.userType = user.userType;
    req.user = {
      ...decoded,
      id: user._id.toString(),
      uid: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      userType: user.userType,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const generateToken = (
  userId: string,
  email: string,
  role: string = 'CLIENT',
  userType?: 'FIRM' | 'LAWYER' | 'CLIENT'
) => {
  return jwt.encode(
    {
      userId,
      email,
      role,
      userType,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    JWT_SECRET
  );
};
